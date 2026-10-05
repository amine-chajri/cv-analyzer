/**
 * AI service backed by Groq through its OpenAI-compatible REST API.
 *
 * Endpoint : POST https://api.groq.com/openai/v1/chat/completions
 * Model    : openai/gpt-oss-120b (override with GROQ_MODEL)
 *
 * JSON output is enforced twice:
 *  1. Server side, with `response_format.type = "json_schema"` + `strict: true`,
 *     which uses constrained decoding on supported Groq models.
 *  2. Client side, with extractJson() which tolerates markdown fences.
 *
 * `strict: true` is only available on a subset of Groq models
 * (openai/gpt-oss-20b, openai/gpt-oss-120b, qwen/qwen3.8-27b). The schema below
 * already satisfies the strict requirements: every property is listed in
 * `required` and every object sets `additionalProperties: false`.
 *
 * Every failure is normalised into an ApiError so the central error handler in
 * middleware/errorHandler.js can turn it into the standard { success, message }
 * JSON response.
 */
const axios = require('axios');
const { ApiError } = require('../middleware/errorHandler');

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const GROQ_CHAT_URL = `${GROQ_BASE_URL}/chat/completions`;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 90000);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES ?? 2);
const RETRY_BASE_DELAY_MS = 1500;

// Groq defaults max_completion_tokens to 1024, which truncates these schemas.
// Set it high enough for a full CV to come back.
const MAX_COMPLETION_TOKENS = Number(process.env.AI_MAX_COMPLETION_TOKENS || 8192);

// GPT-OSS models are reasoning models. Structured extraction does not need deep
// reasoning, and "high" (the model default) adds latency for no benefit here.
// Only gpt-oss-20b/120b accept low|medium|high - sending it to a non-reasoning
// model returns a 400, so it can be turned off with AI_REASONING_EFFORT=none.
const REASONING_EFFORT_RAW = (process.env.AI_REASONING_EFFORT ?? 'low').trim().toLowerCase();
const REASONING_EFFORT = REASONING_EFFORT_RAW && REASONING_EFFORT_RAW !== 'none' ? REASONING_EFFORT_RAW : null;

// Some models reject a custom temperature, so it is opt-in only.
const TEMPERATURE = process.env.GROQ_TEMPERATURE ? Number(process.env.GROQ_TEMPERATURE) : null;

const MAX_RESUME_CHARS = 40000;
const MAX_JD_CHARS = 20000;

const PLACEHOLDER_KEYS = ['your_groq_api_key', 'gsk_your_key_here', 'your_xai_api_key', ''];
const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

// --- JSON Schemas -----------------------------------------------------------
// Groq strict mode requires `additionalProperties: false` on every object.

const RESUME_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    candidateProfile: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fullName: { type: 'string', description: "Candidate's full name, or '' if absent" },
        email: { type: 'string', description: "Email address, or '' if absent" },
        phone: { type: 'string', description: "Phone number, or '' if absent" },
        location: { type: 'string', description: "City/country, or '' if absent" },
        linkedin: { type: 'string', description: 'LinkedIn URL, or an empty string' },
        github: { type: 'string', description: 'GitHub or portfolio URL, or an empty string' },
        currentRole: { type: 'string', description: 'Current or most recent job title' },
        totalYearsExperience: { type: 'number', description: 'Total relevant years of experience' },
        professionalSummary: { type: 'string', description: '2-4 sentence summary of the candidate' },
      },
      required: [
        'fullName',
        'email',
        'phone',
        'location',
        'linkedin',
        'github',
        'currentRole',
        'totalYearsExperience',
        'professionalSummary',
      ],
    },
    skills: {
      type: 'object',
      additionalProperties: false,
      properties: {
        technical: { type: 'array', items: { type: 'string' } },
        toolsAndPlatforms: { type: 'array', items: { type: 'string' } },
        soft: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' }, description: 'Spoken/human languages' },
      },
      required: ['technical', 'toolsAndPlatforms', 'soft', 'languages'],
    },
    experience: {
      type: 'array',
      description: 'Most recent role first',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          company: { type: 'string' },
          jobTitle: { type: 'string' },
          startDate: { type: 'string', description: 'Free text, e.g. "Jan 2023"' },
          endDate: { type: 'string', description: 'Free text, e.g. "Present"' },
          achievements: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key accomplishments from this role',
          },
        },
        required: ['company', 'jobTitle', 'startDate', 'endDate', 'achievements'],
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          institution: { type: 'string' },
          degree: { type: 'string', description: 'e.g. "Bachelor of Science"' },
          fieldOfStudy: { type: 'string', description: 'e.g. "Computer Science"' },
          graduationYear: { type: 'string', description: 'e.g. "2022", or an empty string' },
        },
        required: ['institution', 'degree', 'fieldOfStudy', 'graduationYear'],
      },
    },
    certifications: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          issuer: { type: 'string', description: 'Issuing organisation, or an empty string' },
          year: { type: 'string', description: 'e.g. "2023", or an empty string' },
        },
        required: ['name', 'issuer', 'year'],
      },
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          description: { type: 'string', description: 'What the project does and its impact' },
          techStack: { type: 'array', items: { type: 'string' } },
          link: { type: 'string', description: 'Repository or demo URL, or an empty string' },
        },
        required: ['name', 'description', 'techStack', 'link'],
      },
    },
    strengths: { type: 'array', items: { type: 'string' }, description: '3-6 demonstrated strengths' },
    weaknesses: { type: 'array', items: { type: 'string' }, description: '3-6 real gaps or risks' },
    overallScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Overall quality of the CV as a document, 0-100',
    },
  },
  required: [
    'candidateProfile',
    'skills',
    'experience',
    'education',
    'certifications',
    'projects',
    'strengths',
    'weaknesses',
    'overallScore',
  ],
};

const MATCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overallScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'How well the candidate fits the job, 0-100',
    },
    matchingSkills: {
      type: 'array',
      items: { type: 'string' },
      description: 'Required skills from the job that the candidate genuinely has',
    },
    missingSkills: {
      type: 'array',
      items: { type: 'string' },
      description: 'Required skills from the job that the candidate lacks',
    },
    experienceCompatibility: {
      type: 'object',
      additionalProperties: false,
      properties: {
        compatibility: {
          type: 'string',
          enum: ['poor', 'fair', 'good', 'excellent'],
          description: 'How the candidate experience compares to the job requirement',
        },
        requiredYears: { type: 'number', description: 'Years of experience the job asks for' },
        candidateYears: { type: 'number', description: 'Relevant years the candidate has' },
        details: { type: 'string', description: '2-3 sentences justifying the rating' },
      },
      required: ['compatibility', 'requiredYears', 'candidateYears', 'details'],
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
      description: '4-8 concrete, prioritised actions to raise the fit for this job',
    },
  },
  required: ['overallScore', 'matchingSkills', 'missingSkills', 'experienceCompatibility', 'recommendations'],
};

// --- Prompts ----------------------------------------------------------------

const RESUME_SYSTEM_PROMPT = `You are a senior technical recruiter and CV analyst.
You will receive the plain text of a candidate's CV or resume.

Rules:
- Extract only what the text actually states. Never invent employers, dates, degrees or skills.
- When a field is not present in the text, return an empty string, an empty array, or 0.
- Preserve the candidate's own wording for skills and achievements.
- strengths and weaknesses must be specific and grounded in the CV. No flattery, no invented gaps.
- overallScore rates the CV as a document (clarity, completeness, structure), not employability.
- Reply with JSON only.`;

const MATCH_SYSTEM_PROMPT = `You are a senior technical recruiter screening candidates.
You will receive a candidate's CV text and a job description.

Rules:
- Compare them strictly. matchingSkills must be skills the CV genuinely evidences.
- missingSkills must be genuine requirements from the posting that the CV does not cover.
- overallScore is an integer 0-100 reflecting real alignment. Do not inflate it.
- Ignore requirements that are not actually stated in the job description.
- recommendations must be specific and actionable, not generic advice.
- Reply with JSON only.`;

const buildResumePrompt = (resumeText) => `CANDIDATE CV:
"""
${truncate(resumeText, MAX_RESUME_CHARS)}
"""

Extract the structured candidate profile from the CV above.`;

const buildMatchPrompt = (resumeText, jobDescription) => `TARGET JOB DESCRIPTION:
"""
${truncate(jobDescription, MAX_JD_CHARS)}
"""

CANDIDATE CV:
"""
${truncate(resumeText, MAX_RESUME_CHARS)}
"""

Compare the CV against the job description above.`;

// --- Helpers ----------------------------------------------------------------

function truncate(value, max) {
  const text = String(value ?? '').trim();
  return text.length > max ? `${text.slice(0, max)}\n[...truncated]` : text;
}

function getApiKey() {
  const key = (process.env.GROQ_API_KEY || '').trim();
  if (!key || PLACEHOLDER_KEYS.includes(key.toLowerCase())) {
    throw new ApiError(
      503,
      'The Groq API key is missing. Add a valid GROQ_API_KEY to server/.env (create one at https://console.groq.com/keys) and restart the server.'
    );
  }
  return key;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const asStringArray = (value, maxItems = 12) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter(Boolean)
    .slice(0, maxItems);
};

const asNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/** Pulls a JSON object out of the model reply, tolerating markdown code fences. */
function extractJson(content) {
  const raw = String(content ?? '').trim();
  if (!raw) throw new Error('Model returned an empty response');

  const unfenced = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  const attempts = [unfenced];
  const firstBrace = unfenced.indexOf('{');
  const lastBrace = unfenced.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    attempts.push(unfenced.slice(firstBrace, lastBrace + 1));
  }

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // try the next candidate
    }
  }

  throw new Error('Model returned invalid JSON');
}

/** Reads an error message out of a Groq/OpenAI error body, tolerating both shapes. */
function extractApiMessage(data) {
  if (!data || typeof data !== 'object') return '';
  if (data.error && typeof data.error === 'string') return data.error;
  if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
    return data.error.message;
  }
  return typeof data.message === 'string' ? data.message : '';
}

/** Turns an axios/Groq failure into an ApiError with a message safe to show users. */
function toApiError(err) {
  if (err instanceof ApiError) return err;

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const apiMessage = extractApiMessage(err.response?.data);

    // Groq answers a bad key with 401, but some proxies rewrite it to 400, so
    // the message is inspected before the status code is trusted.
    const looksLikeKeyProblem = /api\s*key|unauthorized|invalid.*credential|authentication/i.test(apiMessage);
    const looksLikeModelProblem = /model.*(not found|deprecat)|unknown model/i.test(apiMessage);

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new ApiError(504, 'The AI service took too long to respond. Please try again.');
    }
    if (status === 401 || status === 403 || looksLikeKeyProblem) {
      return new ApiError(
        503,
        'The Groq API key is missing or invalid. Check GROQ_API_KEY in server/.env and restart the server.'
      );
    }
    if (status === 429) {
      return new ApiError(429, 'The AI service is rate limiting requests. Please wait a moment and try again.');
    }
    if (status === 404 || looksLikeModelProblem) {
      return new ApiError(502, `The AI model "${GROQ_MODEL}" was not found. Check GROQ_MODEL in server/.env.`);
    }
    if (status === 400) {
      return new ApiError(502, `The AI request was rejected by Groq (${apiMessage || 'bad request'}).`);
    }
    return new ApiError(502, 'The AI service is unavailable right now. Please try again.');
  }

  return new ApiError(502, 'The AI service failed to complete the analysis. Please try again.');
}

const isRetryable = (err) => {
  if (err instanceof ApiError) return false;
  if (axios.isAxiosError(err)) {
    if (!err.response) return true; // network / DNS / socket reset
    return RETRYABLE_STATUS.has(err.response.status);
  }
  return /empty response|invalid JSON/i.test(err.message || '');
};

/**
 * Single POST to Groq chat completions with a schema-constrained JSON response.
 * Retries transient failures with linear backoff.
 */
async function callModel({ systemPrompt, userPrompt, schemaName, schema }) {
  const apiKey = getApiKey();

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    response_format: {
      type: 'json_schema',
      json_schema: { name: schemaName, strict: true, schema },
    },
  };
  if (REASONING_EFFORT) body.reasoning_effort = REASONING_EFFORT;
  if (TEMPERATURE !== null && Number.isFinite(TEMPERATURE)) {
    body.temperature = TEMPERATURE;
  }

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await axios.post(GROQ_CHAT_URL, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: AI_TIMEOUT_MS,
      });

      const choice = response.data?.choices?.[0];
      const finishReason = choice?.finish_reason;

      if (finishReason === 'length') {
        throw new Error('AI response was truncated before the JSON was complete');
      }

      return extractJson(choice?.message?.content);
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) break;
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }

  console.error('[aiService] Groq request failed:', lastError?.message || lastError);
  throw toApiError(lastError);
}

// --- Public API -------------------------------------------------------------

/**
 * Parses a resume into a structured candidate profile.
 *
 * @param {string} resumeText Plain text extracted from the uploaded CV.
 * @returns {Promise<object>} Normalised analysis object.
 */
async function analyzeResume(resumeText) {
  const text = String(resumeText ?? '').trim();
  if (text.length < 50) {
    throw new ApiError(400, 'The CV text is too short to analyze. Please upload a readable CV.');
  }

  const parsed = await callModel({
    systemPrompt: RESUME_SYSTEM_PROMPT,
    userPrompt: buildResumePrompt(text),
    schemaName: 'resume_analysis',
    schema: RESUME_SCHEMA,
  });

  const profile = parsed.candidateProfile || {};
  const skills = parsed.skills || {};

  const result = {
    candidateProfile: {
      fullName: asString(profile.fullName),
      email: asString(profile.email),
      phone: asString(profile.phone),
      location: asString(profile.location),
      linkedin: asString(profile.linkedin),
      github: asString(profile.github),
      currentRole: asString(profile.currentRole),
      totalYearsExperience: asNumber(profile.totalYearsExperience),
      professionalSummary: asString(profile.professionalSummary),
    },
    skills: {
      technical: asStringArray(skills.technical, 20),
      toolsAndPlatforms: asStringArray(skills.toolsAndPlatforms, 20),
      soft: asStringArray(skills.soft, 10),
      languages: asStringArray(skills.languages, 10),
    },
    experience: (Array.isArray(parsed.experience) ? parsed.experience : []).slice(0, 12).map((job) => ({
      company: asString(job?.company),
      jobTitle: asString(job?.jobTitle),
      startDate: asString(job?.startDate),
      endDate: asString(job?.endDate),
      achievements: asStringArray(job?.achievements, 6),
    })),
    education: (Array.isArray(parsed.education) ? parsed.education : []).slice(0, 6).map((entry) => ({
      institution: asString(entry?.institution),
      degree: asString(entry?.degree),
      fieldOfStudy: asString(entry?.fieldOfStudy),
      graduationYear: asString(entry?.graduationYear),
    })),
    certifications: (Array.isArray(parsed.certifications) ? parsed.certifications : []).slice(0, 15).map((cert) => ({
      name: asString(cert?.name),
      issuer: asString(cert?.issuer),
      year: asString(cert?.year),
    })),
    projects: (Array.isArray(parsed.projects) ? parsed.projects : []).slice(0, 12).map((project) => ({
      name: asString(project?.name),
      description: asString(project?.description),
      techStack: asStringArray(project?.techStack, 12),
      link: asString(project?.link),
    })),
    strengths: asStringArray(parsed.strengths, 6),
    weaknesses: asStringArray(parsed.weaknesses, 6),
    overallScore: clampScore(parsed.overallScore),
  };

  const isEmpty =
    !result.strengths.length &&
    !result.weaknesses.length &&
    !result.experience.length &&
    !result.education.length;

  if (isEmpty) {
    throw new ApiError(502, 'The AI service returned an unusable analysis. Please try again.');
  }

  return result;
}

/**
 * Compares a resume against a job description.
 *
 * @param {string} resumeText Plain text extracted from the uploaded CV.
 * @param {string} jobDescription Full job posting text.
 * @returns {Promise<object>} Normalised match object.
 */
async function matchResumeWithJob(resumeText, jobDescription) {
  const text = String(resumeText ?? '').trim();
  const jd = String(jobDescription ?? '').trim();

  if (text.length < 50) {
    throw new ApiError(400, 'The CV text is too short to analyze. Please upload a readable CV.');
  }
  if (jd.length < 50) {
    throw new ApiError(400, 'Job description is too short. Please paste the full posting (at least 50 characters).');
  }

  const parsed = await callModel({
    systemPrompt: MATCH_SYSTEM_PROMPT,
    userPrompt: buildMatchPrompt(text, jd),
    schemaName: 'job_match',
    schema: MATCH_SCHEMA,
  });

  const compatibility = parsed.experienceCompatibility || {};
  const rating = ['poor', 'fair', 'good', 'excellent'].includes(compatibility.compatibility)
    ? compatibility.compatibility
    : 'fair';

  const result = {
    overallScore: clampScore(parsed.overallScore),
    matchingSkills: asStringArray(parsed.matchingSkills, 20),
    missingSkills: asStringArray(parsed.missingSkills, 20),
    experienceCompatibility: {
      compatibility: rating,
      requiredYears: asNumber(compatibility.requiredYears),
      candidateYears: asNumber(compatibility.candidateYears),
      details: asString(compatibility.details),
    },
    recommendations: asStringArray(parsed.recommendations, 10),
  };

  if (!result.matchingSkills.length && !result.missingSkills.length && !result.recommendations.length) {
    throw new ApiError(502, 'The AI service returned an unusable match. Please try again.');
  }

  return result;
}

module.exports = { analyzeResume, matchResumeWithJob };
