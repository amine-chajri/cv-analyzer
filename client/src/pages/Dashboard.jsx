import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import TemplatePreview from '../components/TemplatePreview';
import { useAuth } from '../context/AuthContext';
import { getTemplate } from '../data/templates';
import api, { getErrorMessage } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef(null);

  const currentTemplate = getTemplate(user?.preferredTemplate);

  const MIN_JD_LENGTH = 50;

  const handleScan = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please upload your CV first (PDF, DOCX, image or TXT).');
      return;
    }
    if (jobDescription.trim().length < MIN_JD_LENGTH) {
      setError(`Please paste the full job description (at least ${MIN_JD_LENGTH} characters).`);
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('jobDescription', jobDescription.trim());

    setScanning(true);
    try {
      requestRef.current = new AbortController();
      const { data } = await api.post('/analysis/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: requestRef.current.signal,
      });
      navigate(`/analysis/${data.data._id}`, { state: { analysis: data.data } });
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(getErrorMessage(err));
      }
    } finally {
      setScanning(false);
      requestRef.current = null;
    }
  };

  if (scanning) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <section
          className="rounded-none border border-surface-tile-1/50 bg-canvas p-12"
          style={{ letterSpacing: '-0.374px' }}
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <h2 className="typography-hero-display font-bold text-slate-900">
            Analyzing your CV…
          </h2>
          <p className="typography-body max-w-sm mx-auto mt-2" style={{ color: 'var(--color-body-muted)' }}>
            Our AI is comparing your CV against the job description. This usually takes 10–30 seconds.
          </p>
          <button
            onClick={() => requestRef.current?.abort()}
            className="my-6 button-primary rounded-pill py-2.5 px-8 typography-body strong"
          >
            Cancel
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="typography-hero-display font-bold text-slate-900">
          Analyze your CV
        </h1>
        <p className="typography-body mt-2" style={{ color: 'var(--color-body-muted)' }}>
          Upload your CV, paste the job you're targeting, and get an AI-powered match report.
        </p>
      </div>

      <div className="mb-6 rounded-none border border-border-soft bg-canvas p-8" style={{ letterSpacing: '-0.374px' }}>
        {currentTemplate ? (
          <div className="w-12 shrink-0 overflow-hidden rounded-none border border-border-soft">
            <TemplatePreview template={currentTemplate} />
          </div>
        ) : (
          <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-none border border-dashed border-border-soft text-sm">
            📄
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Your template
          </p>
          <p className="truncate font-bold text-slate-900">
            {currentTemplate ? currentTemplate.name : 'None selected'}
          </p>
        </div>
        <Link
          to="/templates"
          className="rounded-lg border border-border-soft px-3.5 py-2 typography-button-utility text-slate-700 transition hover:bg-slate-200"
        >
          {currentTemplate ? 'Change' : 'Choose one'}
        </Link>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleScan} className="space-y-6">
        <div>
          <label className="mb-2 block typography-body strong">
            1. Your CV{' '}
            <span className="font-normal text-slate-400">
              (PDF, DOCX, PNG/JPG image or TXT · max 10 MB)
            </span>
          </label>
          <FileUploader file={file} onChange={setFile} onError={setError} />
        </div>

        <div>
          <label htmlFor="jd" className="mb-2 block typography-body strong">
            2. Target job description{' '}
            <span className="font-normal text-slate-400">
              ({jobDescription.trim().length} chars)
            </span>
          </label>
          <textarea
            id="jd"
            rows={10}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here — responsibilities, requirements, preferred skills…"
            className="w-full rounded-none border border-border-soft bg-white p-4 text-sm leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <button
          type="submit"
          disabled={!file || jobDescription.trim().length < MIN_JD_LENGTH}
          className="w-full rounded-none button-primary rounded-pill py-3.5 typography-body strong"
        >
          Analyze my CV ✨
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Your CV text is stored only for your own analysis history.
      </p>
    </div>
  );
}