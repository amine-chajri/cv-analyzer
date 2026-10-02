import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import api, { getErrorMessage } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef(null);

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
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Analyzing your CV…</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Our AI is comparing your CV against the job description. This usually takes 10–30 seconds.
          </p>
          <button
            onClick={() => requestRef.current?.abort()}
            className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analyze your CV</h1>
        <p className="mt-2 text-slate-600">
          Upload your CV, paste the job you&apos;re targeting, and get an AI-powered match report.
        </p>
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
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            1. Your CV{' '}
            <span className="font-normal text-slate-400">(PDF, DOCX, PNG/JPG image or TXT · max 10 MB)</span>
          </label>
          <FileUploader file={file} onChange={setFile} onError={setError} />
        </div>

        <div>
          <label htmlFor="jd" className="mb-2 block text-sm font-semibold text-slate-700">
            2. Target job description{' '}
            <span className="font-normal text-slate-400">({jobDescription.trim().length} chars)</span>
          </label>
          <textarea
            id="jd"
            rows={10}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here — responsibilities, requirements, preferred skills…"
            className="w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-sm leading-relaxed outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button
          type="submit"
          disabled={!file || jobDescription.trim().length < MIN_JD_LENGTH}
          className="w-full rounded-2xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
