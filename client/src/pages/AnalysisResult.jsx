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

const dateRange = (job) => {
  const start = job.startDate?.trim();
  const end = job.endDate?.trim();
  if (!start && !end) return '';
  return `${start || '?'} – ${end || 'Present'}`;
};

const COMPAT_STYLES = {
  poor: 'border-red-200 bg-red-50 text-red-700',
  fair: 'border-amber-200 bg-amber-50 text-amber-700',
  good: 'border-green-200 bg-green-50 text-green-700',
  excellent: 'border-green-200 bg-green-50 text-green-700',
};

const ChipGroup = ({ label, items }) =>
  items?.length ? (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  ) : null;

const Card = ({ title, icon, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600">
      <span aria-hidden="true">{icon}</span>
      {title}
    </h3>
    <div className="mt-4">{children}</div>
  </section>
);

export default function AnalysisResult() {
  const { id } = useParams();
  const location = useLocation();
  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [loading, setLoading] = useState(!location.state?.analysis);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fresh scan navigates here with state; deep-links fetch from the API
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
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-4xl">😕</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Could not load the analysis</h1>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <Link
          to="/history"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {formatDate(analysis.createdAt)}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
            <span aria-hidden="true">📄</span>
            <span className="truncate">{analysis.originalFileName}</span>
          </h1>
          {profile.fullName && (
            <p className="mt-1 text-sm font-medium text-slate-600">{profile.fullName}</p>
          )}
        </div>
        <Link
          to="/"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          New scan
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <ScoreGauge score={analysis.overallScore} />
        {analysis.resumeScore !== undefined && (
          <p className="mt-4 text-center text-sm text-slate-500">
            CV quality score: <span className="font-semibold text-slate-700">{analysis.resumeScore}/100</span>
            {analysis.aiModel && <span className="mt-1 block text-xs text-slate-400">analyzed by {analysis.aiModel}</span>}
          </p>
        )}
      </div>

      {/* Job fit */}
      <h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">Job fit</h2>
      <div className="grid gap-4 md:grid-cols-2">
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

      <div className="mt-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600">
              <span aria-hidden="true">🧭</span>
              Experience compatibility
            </h3>
            {compat.compatibility && (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  COMPAT_STYLES[compat.compatibility] || COMPAT_STYLES.fair
                }`}
              >
                {compat.compatibility}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Job asks for <span className="font-semibold">{compat.requiredYears ?? 0}</span> year(s) · candidate has{' '}
            <span className="font-semibold">{compat.candidateYears ?? 0}</span> year(s)
          </p>
          {compat.details && <p className="mt-2 text-sm leading-relaxed text-slate-700">{compat.details}</p>}
        </section>
      </div>

      <div className="mt-4">
        <AnalysisSection
          type="recommendations"
          items={analysis.recommendations}
          emptyMessage="No suggestions — your CV already covers the job requirements."
        />
      </div>

      {/* Candidate profile */}
      <h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">Candidate profile</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Summary" icon="🧑‍💼">
          <p className="text-sm leading-relaxed text-slate-700">
            {profile.professionalSummary || 'No professional summary was found in the CV.'}
          </p>
          {profile.currentRole && (
            <p className="mt-3 text-sm text-slate-600">
              Current role: <span className="font-semibold">{profile.currentRole}</span>
            </p>
          )}
          {contactRows.length > 0 && (
            <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
              {contactRows.map(([label, value]) => (
                <div key={label} className="flex gap-2 text-sm">
                  <dt className="w-20 shrink-0 font-semibold text-slate-500">{label}</dt>
                  <dd className="truncate text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card title="Skills" icon="🛠️">
          <ChipGroup label="Technical" items={skills.technical} />
          <ChipGroup label="Tools & platforms" items={skills.toolsAndPlatforms} />
          <ChipGroup label="Soft skills" items={skills.soft} />
          <ChipGroup label="Languages" items={skills.languages} />
          {!skills.technical?.length &&
            !skills.toolsAndPlatforms?.length &&
            !skills.soft?.length &&
            !skills.languages?.length && (
              <p className="text-sm italic text-slate-500">No skills were extracted from the CV.</p>
            )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <AnalysisSection type="strengths" items={analysis.strengths} />
        <AnalysisSection type="weaknesses" items={analysis.weaknesses} />
      </div>

      {/* Experience */}
      <h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">Experience</h2>
      {analysis.experience?.length ? (
        <ul className="space-y-3">
          {analysis.experience.map((job, index) => (
            <li key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{job.jobTitle || 'Role not specified'}</h3>
                {dateRange(job) && <span className="text-sm text-slate-500">{dateRange(job)}</span>}
              </div>
              {job.company && <p className="mt-0.5 text-sm text-slate-600">{job.company}</p>}
              {job.achievements?.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {job.achievements.map((achievement, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                      <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm italic text-slate-500">
          No work experience was found in the CV.
        </p>
      )}

      {/* Education, certifications, projects */}
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card title="Education" icon="🎓">
          {analysis.education?.length ? (
            <ul className="space-y-3">
              {analysis.education.map((entry, index) => (
                <li key={index}>
                  <p className="text-sm font-semibold text-slate-900">{entry.degree || entry.institution}</p>
                  {entry.fieldOfStudy && <p className="text-sm text-slate-700">{entry.fieldOfStudy}</p>}
                  <p className="text-sm text-slate-500">
                    {[entry.institution, entry.graduationYear].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-slate-500">No education entries were found.</p>
          )}
        </Card>

        <Card title="Certifications" icon="🏅">
          {analysis.certifications?.length ? (
            <ul className="space-y-2">
              {analysis.certifications.map((cert, index) => (
                <li key={index} className="text-sm">
                  <span className="font-semibold text-slate-900">{cert.name}</span>
                  {(cert.issuer || cert.year) && (
                    <span className="text-slate-500"> — {[cert.issuer, cert.year].filter(Boolean).join(', ')}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-slate-500">No certifications were found.</p>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Projects" icon="🚀">
          {analysis.projects?.length ? (
            <ul className="space-y-4">
              {analysis.projects.map((project, index) => (
                <li key={index}>
                  <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                  {project.description && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{project.description}</p>
                  )}
                  <ChipGroup label="Tech stack" items={project.techStack} />
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-indigo-600 underline hover:text-indigo-700"
                    >
                      {project.link}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-slate-500">No projects were found.</p>
          )}
        </Card>
      </div>

      <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Job description used for this analysis
        </summary>
        <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {analysis.jobDescription}
        </p>
      </details>
    </div>
  );
}
