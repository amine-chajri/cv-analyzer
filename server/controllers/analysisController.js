const Analysis = require('../models/Analysis');
const { extractCvText } = require('../utils/extractCvText');
const { analyzeResume, matchResumeWithJob } = require('../services/aiService');
const { ApiError } = require('../middleware/errorHandler');

const MIN_JD_LENGTH = 50;

/** POST /api/analysis/scan (multipart: cv file + jobDescription field) */
const scan = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Please attach your CV as a PDF, DOCX, image (PNG/JPG) or TXT file in the "cv" field');
    }

    const jobDescription = String(req.body.jobDescription || '').trim();
    if (jobDescription.length < MIN_JD_LENGTH) {
      throw new ApiError(400, `Job description is too short. Please paste the full posting (at least ${MIN_JD_LENGTH} characters).`);
    }

    // 1. Extract text from the uploaded file
    const rawCvText = await extractCvText(req.file.buffer, req.file.originalname);

    // 2. Analyze and match in parallel - both calls hit the same CV text
    const [resume, match] = await Promise.all([
      analyzeResume(rawCvText),
      matchResumeWithJob(rawCvText, jobDescription),
    ]);

    // 3. Persist under the authenticated user
    const saved = await Analysis.create({
      userId: req.user.id,
      originalFileName: req.file.originalname,
      rawCvText,
      jobDescription,
      candidateProfile: resume.candidateProfile,
      skills: resume.skills,
      experience: resume.experience,
      education: resume.education,
      certifications: resume.certifications,
      projects: resume.projects,
      resumeScore: resume.overallScore,
      strengths: resume.strengths,
      weaknesses: resume.weaknesses,
      overallScore: match.overallScore,
      matchingSkills: match.matchingSkills,
      missingSkills: match.missingSkills,
      experienceCompatibility: match.experienceCompatibility,
      recommendations: match.recommendations,
      aiModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    });

    // 4. Return the saved analysis (without the raw CV text to keep payload light)
    const result = saved.toObject();
    delete result.rawCvText;

    res.status(201).json({
      success: true,
      message: 'CV analyzed successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/analysis/history */
const getHistory = async (req, res, next) => {
  try {
    const analyses = await Analysis.find({ userId: req.user.id })
      .select('-rawCvText')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: analyses });
  } catch (err) {
    next(err);
  }
};

/** GET /api/analysis/:id - owners always; admins for any analysis */
const getAnalysisById = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    const analysis = await Analysis.findOne(query)
      .select('-rawCvText')
      .lean();

    if (!analysis) {
      throw new ApiError(404, 'Analysis not found');
    }

    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
};

module.exports = { scan, getHistory, getAnalysisById };
