import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import AnalysisSection from '../components/AnalysisSection';
import ScoreGauge from '../components/ScoreGauge';
import Spinner from '../components/Spinner';
import api, { getErrorMessage } from '../services/api';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function AnalysisResult() {
  const { id } = useParams();
  const location = useLocation();
  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [loading, setLoading] = useState(!location.state?.analysis);
  const [error, setError] = useState('');

  useEffect(() => {
    if (analysis) return;
    let active = true;
    (async () => {
      try {
        const { data } = await api.get(`/analysis/${id}`);
        if (active) setAnalysis(data.data);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, analysis]);

  if (loading) return <Spinner label="Loading analysis…" />;

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center" style="letter-spacing: -0.374px">
        <p className="text-4xl">😕</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Could not load the analysis</h1>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <Link
          to="/history"
          className="my-6 rounded-none button-primary rounded-pill py-2.5 typography-body strong"
        >
          Back to history
        </Link>
      </div>
    );
  }

  if (!analysis) return null;

  const profile = analysis.candidateProfile || {};
  const skills = analysis.skills || {};
  const compat = analysis.experienceCompatibility || {};

  const contactRows = [
    ['Email', profile.email],
    ['Phone', profile.phone],
    ['Location', profile.location],
    ['LinkedIn', profile.linkedin],
    ['GitHub', profile.github],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10" style="letter-spacing: -0.374px">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="typography-nav-link text-slate-400">
            {formatDate(analysis.createdAt)}
          </p>
          <h1 className="mt-1 flex items-center gap-2 typography-hero-display font-bold text-slate-900">
            <span aria-hidden="true">📄</span>
            <span className="truncate">{analysis.originalFileName}</span>
          </h1>
          {profile.fullName && (
            <p className="mt-1 typography-body small text-slate-600">
              {profile.fullName}
            </p>
          )}
        </div>
        <Link
          to="/"
          className="rounded-none border border-border-soft px-4 py-2 typography-button-utility text-slate-700 transition hover:bg-slate-200"
        >
          New scan
        </Link>
      </div>

      <div className="rounded-none border border-border-soft bg-canvas p-8" style="letter-spacing: -0.374px">
        <ScoreGauge score={analysis.overallScore} />
        {analysis.resumeScore !== undefined && (
          <p className="mt-4 typography-body small text-center">
            CV quality score: <span className="font-semibold text-slate-700">
              {analysis.resumeScore}/100
            </span>
            {analysis.aiModel && <span className="mt-1 block text-xs text-slate-400">analyzed by {analysis.aiModel}</span>}
          </p>
        )}
      </div>

      <h2 className="mt-6 typography-display-lg font-bold text-slate-900">Job fit</h2>
      <div className="grid gap-4 md:grid-cols-2" style="letter-spacing: -0.374px">
        <AnalysisSection
          type="matchingSkills"
          items={analysis.matchingSkills}
          emptyMessage="No job requirements were matched to the CV."
        />
        <AnalysisSection
          type="missingSkills"
          items={analysis.missingSkills}
          emptyMessage="No important requirements appear to be missing."
        />
      </div>

      <div className="mt-6">
        <section
          className="rounded-none border border-border-soft bg-canvas p-8"
          style="letter-spacing: -0.374px"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 typography-body small font-bold uppercase tracking-wider text-slate-600">
              <span aria-hidden="true">🧭</span>
              Experience compatibility
            </h3>
            {compat.compatibility && (
              <span
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
              >
                {compat.compatibility}
              </span>
            )}
          </div>
          <p className="mt-3 typography-body small text-slate-600">
            Job asks for <span className="font-semibold">{compat.requiredYears ?? 0}</span> year(s) · candidate has{' '}
            <span className="font-semibold">{compat.candidateYears ?? 0}</span> year(s)
          </p>
          {compat.details && <p className="mt-2 typography-body small leading-relaxed text-slate-700">{compat.details}</p>}
        </section>
      </div>

      <div className="mt-6">
        <AnalysisSection type="recommendations" items={analysis.recommendations} emptyMessage="No suggestions — your CV already covers the job requirements." />
      </div>

      <h2 className="mt-6 typography-display-lg font-bold text-slate-900">Candidate profile</h2>
      <div className="grid gap-4 md:grid-cols-2" style="letter-spacing: -0.374px">
        <section
          className="rounded-none border border-border-soft bg-canvas p-8"
          style="letter-spacing: -0.374px"
        >
          <h3 className="typography-body small font-bold uppercase tracking-wider text-slate-600">Summary</h3>
          <p className="mt-3 typography-body leading-relaxed text-slate-700">
            {profile.professionalSummary || 'No professional summary was found in the CV.'}
          </p>
          {profile.currentRole && (
            <p className="mt-3 typography-body small text-slate-600">
              Current role: <span className="font-semibold">{profile.currentRole}</span>
            </p>
          )}
          {contactRows.length > 0 && (
            <dl className="mt-4 space-y-1.5 border-t border-border-soft pt-4">
              {contactRows.map(([label, value]) => (
                <div key={label} className="flex gap-2 typography-body">
                  <dt className="w-20 shrink-0 font-semibold text-slate-500">{label}</dt>
                  <dd className="truncate text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section
          className="rounded-none border border-border-soft bg-canvas p-8"
          style="letter-spacing: -0.374px"
        >
          <h3 className="typography-body small font-bold uppercase tracking-wider text-slate-600">Skills</h3>
          <ChipGroup label="Technical" items={skills.technical} />
          <ChipGroup label="Tools & platforms" items={skills.toolsAndPlatforms} />
          <ChipGroup label="Soft skills" items={skills.soft} />
          <ChipGroup label="Languages" items={skills.languages} />
          {skills.technical?.length === 0 &&
            skills.toolsAndPlatforms?.length === 0 &&
            skills.soft?.length === 0 &&
            skills.languages?.length === 0 && (
            <p className="typography-body small italic text-slate-500">No skills were extracted from the CV.</p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2" style="letter-spacing: -0.374px">
        <section
          className="rounded-none border border-border-soft bg-canvas p-8"
          style="letter-spacing: -0.374px"
        >
          <h3 className="typography-body small font-bold uppercase tracking-wider text-slate-600">Education</h3>
          {analysis.education?.length ? (
            <ul className="space-y-3">
              {analysis.education.map((entry, index) => (
                <li key={index}>
                  <p className="typography-body small font-semibold text-slate-900">
                    {entry.degree || entry.institution}
                  </p>
                  {entry.fieldOfStudy && <p className="typography-body small text-slate-700">{entry.fieldOfStudy}</p>}
                  <p className="typography-body smallest text-slate-500">
                    {[entry.institution, entry.graduationYear].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="typography-body small italic text-slate-500">No education entries were found.</p>
          )}
        </section>

        <section
          className="rounded-none border border-border-soft bg-canvas p-8"
          style="letter-spacing: -0.374px"
        >
          <h3 className="typography-body small font-bold uppercase tracking-wider text-slate-600">Certifications</h3>
          {analysis.certifications?.length ? (
            <ul className="space-y-2">
              {analysis.certifications.map((cert, index) => (
                <li key={index}>
                  <span className="typography-body small font-semibold text-slate-900">{cert.name}</span>
                  {(cert.issuer || cert.year) && (
                    <span className="typography-body smallest text-slate-500"> — {[cert.issuer, cert.year].filter(Boolean).join(', ')}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="typography-body small italic text-slate-500">No certifications were found.</p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2" style="letter-spacing: -0.374px">
        <section
          className="rounded-none border border-border-soft bg-canvas p-8"
          style="letter-spacing: -0.374px"
        >
          <h3 className="typography-body small font-bold uppercase tracking-wider text-slate-600">Projects</h3>
          {analysis.projects?.length ? (
            <ul className="space-y-4">
              {analysis.projects.map((project, index) => (
                <li key={index}>
                  <p className="typography-body small font-semibold text-slate-900">{project.name}</p>
                  {project.description && (
                    <p className="mt-1 typography-body small leading-relaxed text-slate-700">{project.description}</p>
                  )}
                  <ChipGroup label="Tech stack" items={project.techStack} />
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block typography-body small text-primary underline hover:text-primary"
                    >
                      {project.link}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="typography-body small italic text-slate-500">No projects were found.</p>
          )}
        </section>
      </div>

      <details className="mt-6 rounded-none border border-border-soft bg-canvas p-8" style="letter-spacing: -0.374px">
        <summary className="cursor-pointer typography-body small font-semibold text-slate-700">
          Job description used for this analysis
        </summary>
        <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap typography-body small leading-relaxed text-slate-600">
          {analysis.jobDescription}
        </p>
      </details>
    </div>
  );
}

const ChipGroup = ({ label, items }) =>
  items?.length ? (
    <div>
      <p className="typography-body smallest uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="rounded-full bg-canvas-parchment px-3 py-1 typography-caption font-medium text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  ) : null;