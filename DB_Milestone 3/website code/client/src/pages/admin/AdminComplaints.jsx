import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import {
  fetchAdminComplaints, fetchComplaint, fetchAvailableStaff,
  assignComplaint, updateComplaintStatus, addAdminComment,
} from '../../services/complaintService';

const adminNav = [
  { to: '/admin/dashboard',  label: 'Dashboard',      icon: '📊' },
  { to: '/admin/users',      label: 'User Management', icon: '👥' },
  { to: '/admin/complaints', label: 'Complaints',      icon: '📋' },
  { to: '/admin/assign',     label: 'Assign Work',     icon: '🔁' },
  { to: '/admin/reports',    label: 'Reports',         icon: '📈' },
];

const STATUSES  = ['all','Open','Assigned','In Progress','Resolved','Closed'];
const PRIORITIES = ['all','Critical','High','Medium','Low'];

function Skeleton({ h = 'h-36' }) { return <div className={`${h} animate-pulse rounded-2xl bg-slate-200`} />; }

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [staff, setStaff]             = useState([]);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [newStatus, setNewStatus]     = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [commentText, setCommentText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = { page };
      if (statusFilter !== 'all')  p.status   = statusFilter;
      if (priorityFilter !== 'all') p.priority = priorityFilter;
      if (search) p.search = search;
      const d = await fetchAdminComplaints(p);
      setComplaints(d.complaints);
      setPagination(d.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchAvailableStaff().then(setStaff).catch(console.error); }, []);

  const openDetail = async (c) => {
    setDetailLoading(true); setSelected(c);
    setAssignStaffId(c.ComplaintAssignment?.assigned_to || '');
    setNewStatus(c.status?.status_name || '');
    setStatusRemarks(''); setCommentText(''); setActionMsg('');
    try {
      const full = await fetchComplaint(c.complaint_id);
      setSelected(full);
      setAssignStaffId(full.ComplaintAssignment?.assigned_to || '');
      setNewStatus(full.status?.status_name || '');
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const handleAssign = async () => {
    if (!assignStaffId) return;
    setActionLoading(true);
    try {
      const u = await assignComplaint(selected.complaint_id, assignStaffId);
      setSelected(u); setNewStatus(u.status?.status_name || '');
      setActionMsg('✅ Complaint assigned successfully.'); load();
    } catch (e) { setActionMsg('❌ ' + (e.response?.data?.message || 'Failed')); }
    finally { setActionLoading(false); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setActionLoading(true);
    try {
      const u = await updateComplaintStatus(selected.complaint_id, newStatus, statusRemarks);
      setSelected(u); setNewStatus(u.status?.status_name || '');
      setActionMsg(`✅ Status updated to "${newStatus}".`); load();
    } catch (e) { setActionMsg('❌ ' + (e.response?.data?.message || 'Failed')); }
    finally { setActionLoading(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault(); if (!commentText.trim()) return;
    setActionLoading(true);
    try {
      const c = await addAdminComment(selected.complaint_id, commentText.trim());
      setSelected(p => ({ ...p, Comments: [...(p.Comments || []), c] }));
      setCommentText('');
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  return (
    <DashboardLayout title="Administrator Portal" navItems={adminNav}>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">All Complaints</h1>
          <p className="mt-0.5 text-sm text-slate-500">{pagination ? `${pagination.total} total` : '…'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input type="search" placeholder="Search title or ticket…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500">
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500">
          {PRIORITIES.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p}</option>)}
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {complaints.map(c => (
            <button key={c.complaint_id} onClick={() => openDetail(c)} type="button" className="text-left w-full">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-slate-400">{c.ticket_id}</span>
                  <div className="flex gap-1.5">
                    <PriorityBadge priority={c.priority?.priority_name} />
                    <StatusBadge status={c.status?.status_name} />
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{c.title}</h3>
                <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                  <div>📍 {c.Location?.Building?.building_name} — {c.Location?.room_no}</div>
                  <div>🏷️ {c.Category?.category_name} &nbsp;·&nbsp; 👤 {c.submitter?.full_name}</div>
                  <div>📅 {new Date(c.submitted_at).toLocaleDateString()}</div>
                </div>
              </div>
            </button>
          ))}
          {complaints.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white py-16 text-center">
              <span className="text-4xl">📭</span>
              <p className="mt-3 font-semibold text-slate-600">No complaints found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-emerald-700 text-white shadow' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
              <div>
                <span className="font-mono text-xs text-slate-400">{selected.ticket_id}</span>
                <h3 className="mt-0.5 font-bold text-slate-800 text-base">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 text-lg leading-none transition-colors">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {detailLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
              ) : (<>
                <div className="flex gap-2">
                  <PriorityBadge priority={selected.priority?.priority_name} />
                  <StatusBadge status={selected.status?.status_name} />
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <div><span className="block text-xs font-semibold uppercase text-slate-400 mb-0.5">Location</span>{selected.Location?.Building?.building_name} — {selected.Location?.room_no}</div>
                  <div><span className="block text-xs font-semibold uppercase text-slate-400 mb-0.5">Category</span>{selected.Category?.category_name}</div>
                  <div><span className="block text-xs font-semibold uppercase text-slate-400 mb-0.5">Submitted by</span>{selected.submitter?.full_name}</div>
                  <div><span className="block text-xs font-semibold uppercase text-slate-400 mb-0.5">Date</span>{new Date(selected.submitted_at).toLocaleString()}</div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Description</p>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
                </div>

                {actionMsg && (
                  <div className={`rounded-xl px-4 py-3 text-sm font-medium ${actionMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {actionMsg}
                  </div>
                )}

                {/* Assign */}
                {['Open','Assigned'].includes(selected.status?.status_name) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-bold text-slate-700">Assign to Staff</p>
                    <div className="flex gap-2">
                      <select value={assignStaffId} onChange={e => setAssignStaffId(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500">
                        <option value="">— Select staff member —</option>
                        {staff.map(s => (
                          <option key={s.user_id} value={s.user_id}>
                            {s.User?.full_name} ({s.staff_code}) · {s.workload_count} active
                          </option>
                        ))}
                      </select>
                      <button onClick={handleAssign} disabled={actionLoading || !assignStaffId}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors">
                        Assign
                      </button>
                    </div>
                  </div>
                )}

                {/* Status update */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-bold text-slate-700">Update Status</p>
                  <div className="space-y-2">
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500">
                      {['Open','Assigned','In Progress','Resolved','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input value={statusRemarks} onChange={e => setStatusRemarks(e.target.value)}
                      placeholder="Remarks (optional)…"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500" />
                    <button onClick={handleStatusUpdate} disabled={actionLoading || !newStatus}
                      className="w-full rounded-xl bg-purple-700 py-2.5 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-50 transition-colors">
                      Update Status
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                {selected.StatusHistories?.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-slate-400">Status Timeline</p>
                    <div className="space-y-2 border-l-2 border-slate-200 pl-4">
                      {selected.StatusHistories.map(h => (
                        <div key={h.history_id} className="text-xs relative">
                          <div className="absolute -left-5 top-1 h-2 w-2 rounded-full bg-emerald-500 border-2 border-white" />
                          <span className="font-semibold text-slate-700">
                            {h.oldStatus ? `${h.oldStatus.status_name} → ` : ''}{h.newStatus?.status_name}
                          </span>
                          <span className="ml-2 text-slate-400">by {h.changer?.full_name}</span>
                          {h.remarks && <p className="text-slate-500 mt-0.5">{h.remarks}</p>}
                          <p className="text-slate-400">{new Date(h.changed_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-slate-400">Comments</p>
                  <div className="mb-3 space-y-2">
                    {(selected.Comments || []).map(c => (
                      <div key={c.comment_id} className={`rounded-xl p-3 text-sm ${c.comment_type === 'admin' ? 'bg-purple-50 border border-purple-200' : c.comment_type === 'staff' ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50 border border-slate-200'}`}>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-slate-700">{c.author?.full_name} <span className="text-xs font-normal text-slate-400 capitalize">({c.author?.role_type?.replace('_',' ')})</span></span>
                          <span className="text-xs text-slate-400">{new Date(c.comment_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600">{c.content}</p>
                      </div>
                    ))}
                    {!(selected.Comments?.length) && <p className="text-xs text-slate-400 italic">No comments yet.</p>}
                  </div>
                  <form onSubmit={handleComment} className="flex gap-2">
                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                      placeholder="Add an admin note…"
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500" />
                    <button type="submit" disabled={actionLoading || !commentText.trim()}
                      className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-50">
                      Send
                    </button>
                  </form>
                </div>
              </>)}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex-shrink-0">
              <button onClick={() => setSelected(null)}
                className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
