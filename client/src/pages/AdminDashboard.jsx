import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import api, { getErrorMessage } from '../services/api';

const TABS = [
  { key: 'users', label: '👥 Users' },
  { key: 'analyses', label: '📄 All Analyses' },
];

const scoreBadge = (score) => {
  if (score == null) return 'text-slate-400';
  if (score >= 75) return 'bg-primary/10 text-primary';
  if (score >= 50) return 'bg-canvas-parchment/50 text-slate-400';
  return 'bg-surface-tile-1 text-on-dark';
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-none border border-border-soft bg-canvas/50 p-5 typography-body small" style="letter-spacing: -0.374px">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || 'text-slate-100'}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchAdminData = async () => {
    const [statsRes, usersRes, analysesRes] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/analyses'),
    ]);
    return {
      stats: statsRes.data.data,
      users: usersRes.data.data || [],
      analyses: analysesRes.data.data || [],
    };
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchAdminData();
        if (!active) return;
        setStats(data.stats);
        setUsers(data.users);
        setAnalyses(data.analyses);
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

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAdminData();
      setStats(data.stats);
      setUsers(data.users);
      setAnalyses(data.analyses);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const changeRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    if (
      !window.confirm(
        `${nextRole === 'admin' ? 'Promote' : 'Demote'} ${user.email} to ${nextRole}?`
      )
    )
      return;
    setBusyId(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/role`, { role: nextRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: nextRole } : u))
      );
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (user) => {
    if (
      !window.confirm(
        `Delete ${user.email} permanently?\nThis also deletes ALL of their analyses. This cannot be undone.`
      )
    )
      return;
    setBusyId(user._id);
    try {
      await api.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      refresh();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const removeAnalysis = async (analysis) => {
    if (!window.confirm(`Delete the analysis of "${analysis.originalFileName}"?`)) return;
    setBusyId(analysis._id);
    try {
      await api.delete(`/admin/analyses/${analysis._id}`);
      setAnalyses((prev) => prev.filter((a) => a._id !== analysis._id));
      refresh();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Spinner label="Loading admin dashboard…" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" style="letter-spacing: -0.374px">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 typography-hero-display font-bold text-slate-900">
            🛡️ Admin Dashboard
          </h1>
          <p className="mt-1 typography-body small text-slate-500">
            Platform overview, user and content management.
          </p>
        </div>
        <button onClick={refresh} className="rounded-none border border-border-soft px-4 py-2 typography-button-utility text-slate-700 transition hover:bg-slate-200">
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 typography-small text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4" style="letter-spacing: -0.374px">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="Total analyses" value={stats.totalAnalyses} />
          <StatCard label="Scans (last 7 days)" value={stats.analysesLast7Days} accent="text-primary" />
          <StatCard label="Avg match score" value={`${stats.averageMatchScore}%`} accent="text-primary" />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-none px-4 py-2 typography-button-utility transition ${
              tab === t.key
                ? 'bg-primary text-white shadow'
                : 'border border-border-soft bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="overflow-x-auto rounded-none border border-border-soft bg-canvas" style="letter-spacing: -0.374px">
          <table className="w-full text-left typography-body small">
            <thead className="border-b border-border-soft bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Scans</th>
                <th className="px-4 py-3">Avg score</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-900">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 typography-caption small font-semibold ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-900 text-slate-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{u.analysisCount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 typography-caption small font-bold ${scoreBadge(u.avgScore)}`}>
                      {u.avgScore != null ? `${u.avgScore}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => changeRole(u)}
                        disabled={busyId === u._id}
                        className="rounded-none border border-border-soft px-3 py-1.5 typography-button-utility text-slate-400 transition hover:bg-slate-200 disabled:opacity-50"
                      >
                        {u.role === 'admin' ? 'Demote' : 'Make admin'}
                      </button>
                      <button
                        onClick={() => removeUser(u)}
                        disabled={busyId === u._id}
                        className="rounded-none border border-border-soft px-3 py-1.5 typography-button-utility text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Analyses table */}
      {tab === 'analyses' && (
        <div className="overflow-x-auto rounded-none border border-border-soft bg-canvas" style="letter-spacing: -0.374px">
          <table className="w-full text-left typography-body small">
            <thead className="border-b border-border-soft bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">CV file</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {analyses.map((a) => (
                <tr key={a._id} className="hover:bg-slate-900">
                  <td className="max-w-[220px] px-4 py-3">
                    <Link to={`/analysis/${a._id}`} className="truncate font-semibold text-primary hover:underline">
                      {a.originalFileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{a.userId?.name || 'Deleted user'}</p>
                    <p className="text-xs text-slate-400">{a.userId?.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 typography-caption small font-bold ${scoreBadge(a.overallScore)}`}>
                      {a.overallScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/analysis/${a._id}`}
                        className="rounded-none border border-border-soft px-3 py-1.5 typography-button-utility text-slate-400 transition hover:bg-slate-200"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => removeAnalysis(a)}
                        disabled={busyId === a._id}
                        className="rounded-none border border-border-soft px-3 py-1.5 typography-button-utility text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {analyses.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-slate-400">No analyses yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}