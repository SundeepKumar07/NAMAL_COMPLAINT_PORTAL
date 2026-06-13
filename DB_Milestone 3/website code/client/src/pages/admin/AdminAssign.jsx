import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { fetchAdminComplaints, fetchAvailableStaff, assignComplaint } from '../../services/complaintService';

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'User Management', icon: '👥' },
  { to: '/admin/complaints', label: 'Complaints', icon: '📋' },
  { to: '/admin/assign', label: 'Assign Work', icon: '🔁' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
];

const TABS = [
  { id: 'Open', label: 'Unassigned', icon: '🔓' },
  { id: 'In Progress', label: 'In Progress', icon: '⚙️' },
  { id: 'Resolved', label: 'Resolved', icon: '✅' },
];

export default function AdminAssign() {
  const [tab, setTab] = useState('Open');
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState({});
  const [assigning, setAssigning] = useState({});
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [cData, sData] = await Promise.all([
        fetchAdminComplaints({ status: tab, page: 1 }),
        fetchAvailableStaff(),
      ]);
      setComplaints(cData.complaints);
      setStaff(sData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const handleAssign = async (complaint_id) => {
    const staffId = assignments[complaint_id];
    if (!staffId) return;
    setAssigning((p) => ({ ...p, [complaint_id]: true }));
    try {
      await assignComplaint(complaint_id, staffId);
      const staffMember = staff.find((s) => s.user_id === staffId);
      setMsg(`✅ Complaint assigned to ${staffMember?.User?.full_name}`);
      setTimeout(() => setMsg(''), 3000);
      load();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Assignment failed'));
    } finally {
      setAssigning((p) => ({ ...p, [complaint_id]: false }));
    }
  };

  return (
    <DashboardLayout title="Administrator Portal" navItems={adminNav}>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Assign Work to Staff</h2>
        <p className="text-sm text-slate-500">Route complaints to the right maintenance staff</p>
      </div>

      {msg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Staff cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {staff.map((s) => (
          <div key={s.user_id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800 truncate">{s.User?.full_name}</span>
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                s.availability_status === 'available' ? 'bg-emerald-500' :
                s.availability_status === 'busy' ? 'bg-orange-400' : 'bg-slate-400'}`} />
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{s.staff_code}</p>
            <p className="mt-1 text-xs text-slate-500">Workload: <span className="font-semibold">{s.workload_count}</span></p>
          </div>
        ))}
        {staff.length === 0 && !loading && (
          <p className="col-span-4 text-sm text-slate-400">No available staff found.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Complaints list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}</div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div key={c.complaint_id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-slate-500">{c.ticket_id}</span>
                  <h3 className="mt-0.5 font-semibold text-slate-800">{c.title}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>📍 {c.Location?.Building?.building_name} — {c.Location?.room_no}</span>
                    <span>🏷️ {c.Category?.category_name}</span>
                    <span>👤 {c.submitter?.full_name}</span>
                    <span>📅 {new Date(c.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <PriorityBadge priority={c.priority?.priority_name} />
                  <StatusBadge status={c.status?.status_name} />
                </div>
              </div>

              {/* Assignment controls for unassigned */}
              {tab === 'Open' && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select value={assignments[c.complaint_id] || ''}
                    onChange={(e) => setAssignments({ ...assignments, [c.complaint_id]: e.target.value })}
                    className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500">
                    <option value="">— Select staff member —</option>
                    {staff.map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.User?.full_name} ({s.staff_code}) · {s.workload_count} active
                      </option>
                    ))}
                  </select>
                  <button onClick={() => handleAssign(c.complaint_id)}
                    disabled={!assignments[c.complaint_id] || assigning[c.complaint_id]}
                    className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors">
                    {assigning[c.complaint_id] ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
              )}

              {/* In progress — show who it's assigned to */}
              {tab === 'In Progress' && c.ComplaintAssignment && (
                <div className="mt-3 text-xs text-slate-500">
                  👷 Assigned to: <span className="font-semibold text-slate-700">{c.ComplaintAssignment?.assignee?.User?.full_name || '—'}</span>
                </div>
              )}
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-400">
              <p className="text-4xl mb-3">{TABS.find((t) => t.id === tab)?.icon}</p>
              <p className="font-semibold">No {TABS.find((t) => t.id === tab)?.label.toLowerCase()} complaints</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
