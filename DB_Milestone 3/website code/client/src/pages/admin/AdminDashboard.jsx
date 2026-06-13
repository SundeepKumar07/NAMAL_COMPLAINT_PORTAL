import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import BarChart from '../../components/BarChart';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { fetchAnalytics } from '../../services/reportService';
import { fetchAdminComplaints } from '../../services/complaintService';

const adminNav = [
  { to: '/admin/dashboard',  label: 'Dashboard',       icon: '📊' },
  { to: '/admin/users',      label: 'User Management',  icon: '👥' },
  { to: '/admin/complaints', label: 'Complaints',       icon: '📋' },
  { to: '/admin/assign',     label: 'Assign Work',      icon: '🔁' },
  { to: '/admin/reports',    label: 'Reports',          icon: '📈' },
];

const CATEGORY_COLORS = ['bg-yellow-400','bg-blue-400','bg-orange-400','bg-purple-400','bg-emerald-400','bg-pink-400','bg-slate-400'];
const PRIORITY_COLORS = { Critical:'bg-red-500', High:'bg-orange-400', Medium:'bg-blue-400', Low:'bg-slate-400' };

function Skeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

export default function AdminDashboard() {
  const [stats, setStats]         = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byPriority, setByPriority] = useState([]);
  const [recent, setRecent]       = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchAdminComplaints({ page: 1 })])
      .then(([a, c]) => {
        setStats({ ...a.stats, total: a.total });
        setByCategory(a.byCategory.map((x, i) => ({ ...x, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })));
        setByPriority(a.byPriority.map((x)    => ({ ...x, color: PRIORITY_COLORS[x.label] || 'bg-slate-400' })));
        setRecent(c.complaints.slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Administrator Portal" navItems={adminNav}>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">System Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Live complaint activity across Namal University campus</p>
      </div>

      {/* KPI grid */}
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

      {/* Charts */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        {loading ? <><Skeleton className="h-52" /><Skeleton className="h-52" /></> : <>
          <BarChart title="Complaints by Category" items={byCategory} />
          <BarChart title="Complaints by Priority"  items={byPriority} />
        </>}
      </div>

      {/* Recent complaints */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-bold text-slate-800">Recent Complaints</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest activity</p>
          </div>
          <a href="/admin/complaints" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
            View all →
          </a>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Ticket</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map(c => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{c.ticket_id}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-800 max-w-[180px] truncate">{c.title}</td>
                    <td className="px-6 py-3.5 text-slate-500">{c.Category?.category_name}</td>
                    <td className="px-6 py-3.5"><PriorityBadge priority={c.priority?.priority_name} /></td>
                    <td className="px-6 py-3.5"><StatusBadge status={c.status?.status_name} /></td>
                    <td className="px-6 py-3.5 text-slate-400">{new Date(c.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <span className="text-3xl block mb-2">📭</span>No complaints yet
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
