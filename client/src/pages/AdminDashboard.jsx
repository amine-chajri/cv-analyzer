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
  if (score >= 75) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || 'text-slate-900'}`}>{value}</p>
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

  // Pure data fetcher (no setState) shared by the initial load and manual refresh
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
            🛡️ Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">Platform overview, user and content management.</p>
        </div>
        <button
          onClick={refresh}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="Total analyses" value={stats.totalAnalyses} />
          <StatCard label="Scans (last 7 days)" value={stats.analysesLast7Days} accent="text-indigo-600" />
          <StatCard label="Avg match score" value={`${stats.averageMatchScore}%`} accent="text-green-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-indigo-600 text-white shadow'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Scans</th>
                <th className="px-4 py-3">Avg score</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{u.analysisCount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${scoreBadge(u.avgScore)}`}>
                      {u.avgScore != null ? `${u.avgScore}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => changeRole(u)}
                        disabled={busyId === u._id}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        {u.role === 'admin' ? 'Demote' : 'Make admin'}
                      </button>
                      <button
                        onClick={() => removeUser(u)}
                        disabled={busyId === u._id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Analyses table */}
      {tab === 'analyses' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">CV file</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analyses.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="max-w-[220px] px-4 py-3">
                    <Link to={`/analysis/${a._id}`} className="truncate font-semibold text-indigo-600 hover:underline">
                      {a.originalFileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{a.userId?.name || 'Deleted user'}</p>
                    <p className="text-xs text-slate-500">{a.userId?.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${scoreBadge(a.overallScore)}`}>
                      {a.overallScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/analysis/${a._id}`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => removeAnalysis(a)}
                        disabled={busyId === a._id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {analyses.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                    No analyses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
