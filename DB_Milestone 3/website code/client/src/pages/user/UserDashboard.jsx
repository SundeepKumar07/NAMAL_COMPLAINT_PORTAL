import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { fetchMyStats, fetchComplaints } from '../../services/complaintService';

const userNav = [
  { to: '/user/dashboard',   label: 'Dashboard',        icon: '📊' },
  { to: '/user/submit',      label: 'Submit Complaint',  icon: '➕' },
  { to: '/user/complaints',  label: 'My Complaints',     icon: '📋' },
];

function Skeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats,  setStats]  = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMyStats(), fetchComplaints({ page: 1 })])
      .then(([s, d]) => { setStats(s); setRecent(d.complaints.slice(0, 5)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Complaint Filer Portal" navItems={userNav}>

      {/* Welcome banner */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold backdrop-blur-sm">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">Welcome, {user?.full_name}!</h1>
            <p className="mt-0.5 text-sm text-emerald-100">
              <span className="font-mono font-semibold">{user?.profile?.university_id || '—'}</span>
              {user?.profile?.user_type && <span className="ml-2 capitalize opacity-80">· {user.profile.user_type}</span>}
            </p>
          </div>
          <Link to="/user/submit"
            className="ml-auto flex-shrink-0 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur-sm hover:bg-white/25 transition-colors whitespace-nowrap">
            + New Complaint
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
          : <>
              <StatCard label="Total"       value={stats?.total}       color="slate"   icon="📋" />
              <StatCard label="Open"        value={stats?.open}        color="blue"    icon="🔓" />
              <StatCard label="Assigned"    value={stats?.assigned}    color="purple"  icon="👷" />
              <StatCard label="In Progress" value={stats?.in_progress} color="orange"  icon="⚙️" />
              <StatCard label="Resolved"    value={stats?.resolved}    color="emerald" icon="✅" />
              <StatCard label="Closed"      value={stats?.closed}      color="slate"   icon="🔒" />
            </>
        }
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Link to="/user/submit"
          className="group flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-2xl text-white shadow-sm group-hover:scale-105 transition-transform">
            ➕
          </div>
          <div>
            <p className="font-bold text-slate-800">Submit a Complaint</p>
            <p className="text-sm text-slate-500">Report a maintenance issue</p>
          </div>
          <span className="ml-auto text-emerald-600 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link to="/user/complaints"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl shadow-sm group-hover:scale-105 transition-transform">
            📋
          </div>
          <div>
            <p className="font-bold text-slate-800">My Complaints</p>
            <p className="text-sm text-slate-500">Track your complaint history</p>
          </div>
          <span className="ml-auto text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Recent complaints */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-bold text-slate-800">My Recent Complaints</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your latest submissions</p>
          </div>
          <Link to="/user/complaints" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
        ) : recent.length === 0 ? (
          <div className="py-14 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-3 font-semibold text-slate-700">No complaints yet</p>
            <p className="mt-1 text-sm text-slate-400">Submit your first complaint to get started</p>
            <Link to="/user/submit" className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
              Submit Complaint →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recent.map(c => (
              <Link key={c.complaint_id} to="/user/complaints"
                className="flex flex-wrap items-start justify-between gap-3 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <span className="font-mono text-xs text-slate-400">{c.ticket_id}</span>
                  <p className="mt-0.5 truncate font-semibold text-slate-800">{c.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>🏷️ {c.Category?.category_name}</span>
                    <span>📅 {new Date(c.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={c.priority?.priority_name} />
                  <StatusBadge status={c.status?.status_name} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
