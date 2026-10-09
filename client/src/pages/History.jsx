import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import api, { getErrorMessage } from '../services/api';

const scoreColor = (score) => {
  if (score >= 75) return 'bg-primary/10 text-primary';
  if (score >= 50) return 'bg-canvas-parchment/50 text-slate-400';
  return 'bg-surface-tile-1 text-on-dark';
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
    <div className="mx-auto max-w-4xl px-4 py-10" style="letter-spacing: -0.374px">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="typography-hero-display font-bold text-slate-900">History</h1>
          <p className="typography-body mt-2" style={{ color: 'var(--color-body-muted)' }}>
            All past CV analyses, newest first.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-none border border-border-soft px-4 py-2 typography-button-utility text-slate-700 transition hover:bg-slate-200"
        >
          New scan
        </Link>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {!error && analyses.length === 0 && (
        <section
          className="rounded-none border border-border-soft bg-surface-tile-1 p-12 text-center"
          style="letter-spacing: -0.374px"
        >
          <p className="text-4xl">🗂️</p>
          <h2 className="mt-4 typography-display-lg font-bold text-slate-900">No analyses yet</h2>
          <p className="mt-2 typography-body small text-slate-500">
            Run your first scan from the dashboard to see results here.
          </p>
          <Link
            to="/"
            className="my-6 rounded-none button-primary rounded-pill py-2.5 typography-body strong"
          >
            Analyze my first CV
          </Link>
        </section>
      )}

      {analyses.length > 0 && (
        <ul className="space-y-4" style="letter-spacing: -0.374px">
          {analyses.map((item) => (
            <li key={item._id} className="rounded-none border border-border-soft bg-canvas p-6 transition">
              <Link
                to={`/analysis/${item._id}`}
                className="flex items-center gap-4"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-none ${scoreColor(item.overallScore)}`}
                >
                  {item.overallScore}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{item.originalFileName}</p>
                  <p className="mt-1 typography-body small text-slate-500">
                    {formatDate(item.createdAt)} · {item.missingSkills?.length ?? 0} missing skills ·{' '}
                    {item.weaknesses?.length ?? 0} weaknesses
                  </p>
                </div>
                <span className="text-slate-400" aria-hidden="true">
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