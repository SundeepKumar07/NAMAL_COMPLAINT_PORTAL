import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { fetchMyStats } from '../../services/complaintService';
import { fetchStaffTasks } from '../../services/staffService';

const staffNav = [
  { to: '/staff/dashboard',   label: 'Dashboard',    icon: '📊' },
  { to: '/staff/complaints',  label: 'My Tasks',     icon: '📋' },
  { to: '/staff/report',      label: 'Work Report',  icon: '📝' },
];

function Skeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMyStats(), fetchStaffTasks({ page: 1 })])
      .then(([s, d]) => {
        setStats(s);
        setTasks(d.complaints.filter(c => ['Assigned','In Progress'].includes(c.status?.status_name)).slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const avail = user?.profile?.availability_status || 'available';
  const availColor = avail === 'available' ? 'bg-emerald-500' : avail === 'busy' ? 'bg-orange-400' : 'bg-slate-400';
  const availBadge = avail === 'available' ? 'bg-emerald-100 text-emerald-700' : avail === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600';

  return (
    <DashboardLayout title="Maintenance Staff Portal" navItems={staffNav}>

      {/* Welcome banner */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold backdrop-blur-sm">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">Welcome, {user?.full_name}!</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-orange-100">{user?.profile?.staff_code || '—'}</span>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${availBadge} bg-white/20 text-white`}>
                <span className={`h-1.5 w-1.5 rounded-full ${availColor}`} />
                {avail}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right flex-shrink-0">
            <p className="text-2xl font-extrabold">{user?.profile?.workload_count ?? 0}</p>
            <p className="text-xs text-orange-100">Active tasks</p>
          </div>
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
              <StatCard label="Workload"    value={user?.profile?.workload_count ?? 0} color="orange" icon="🔢" />
            </>
        }
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Link to="/staff/complaints"
          className="group flex items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-2xl text-white shadow-sm group-hover:scale-105 transition-transform">📋</div>
          <div>
            <p className="font-bold text-slate-800">View My Tasks</p>
            <p className="text-sm text-slate-500">See all assigned complaints</p>
          </div>
          <span className="ml-auto text-orange-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link to="/staff/report"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl shadow-sm group-hover:scale-105 transition-transform">📝</div>
          <div>
            <p className="font-bold text-slate-800">Submit Work Report</p>
            <p className="text-sm text-slate-500">Log progress and update status</p>
          </div>
          <span className="ml-auto text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Active tasks */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-bold text-slate-800">Active Tasks</h2>
            <p className="text-xs text-slate-400 mt-0.5">Assigned &amp; in progress</p>
          </div>
          <Link to="/staff/complaints" className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">{[1,2].map(i => <Skeleton key={i} className="h-14" />)}</div>
        ) : tasks.length === 0 ? (
          <div className="py-14 text-center">
            <span className="text-4xl">🎉</span>
            <p className="mt-3 font-semibold text-slate-700">All clear!</p>
            <p className="mt-1 text-sm text-slate-400">No active tasks assigned to you.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {tasks.map(c => (
              <Link key={c.complaint_id} to="/staff/complaints"
                className="flex flex-wrap items-start justify-between gap-3 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <span className="font-mono text-xs text-slate-400">{c.ticket_id}</span>
                  <p className="mt-0.5 truncate font-semibold text-slate-800">{c.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>📍 {c.Location?.Building?.building_name} — {c.Location?.room_no}</span>
                    <span>🏷️ {c.Category?.category_name}</span>
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
