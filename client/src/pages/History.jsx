import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import api, { getErrorMessage } from '../services/api';

const scoreColor = (score) => {
  if (score >= 75) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get('/analysis/history');
        if (active) setAnalyses(data.data || []);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner label="Loading your history…" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">History</h1>
          <p className="mt-2 text-slate-600">All past CV analyses, newest first.</p>
        </div>
        <Link
          to="/"
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          New scan
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {!error && analyses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-4xl">🗂️</p>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No analyses yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Run your first scan from the dashboard to see results here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Analyze my first CV
          </Link>
        </div>
      )}

      {analyses.length > 0 && (
        <ul className="space-y-3">
          {analyses.map((item) => (
            <li key={item._id}>
              <Link
                to={`/analysis/${item._id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-bold ${scoreColor(item.overallScore)}`}
                >
                  {item.overallScore}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{item.originalFileName}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {formatDate(item.createdAt)} · {item.missingSkills?.length ?? 0} missing skills ·{' '}
                    {item.weaknesses?.length ?? 0} weaknesses
                  </p>
                </div>
                <span className="shrink-0 text-slate-400" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
