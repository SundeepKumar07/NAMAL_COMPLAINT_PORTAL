import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { fetchComplaint, addComment } from '../../services/complaintService';
import { fetchStaffTasks, staffUpdateStatus } from '../../services/staffService';

const staffNav = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/staff/complaints', label: 'My Tasks', icon: '📋' },
  { to: '/staff/report', label: 'Work Report', icon: '📝' },
];

const STATUSES = ['all', 'Assigned', 'In Progress', 'Resolved'];

export default function StaffComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filter !== 'all') params.status = filter;
      const data = await fetchStaffTasks(params);
      setComplaints(data.complaints);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, page]);

  const openDetail = async (c) => {
    setDetailLoading(true);
    setSelected(c);
    setCommentText('');
    setStatusMsg('');
    try {
      const full = await fetchComplaint(c.complaint_id);
      setSelected(full);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selected) return;
    setCommentLoading(true);
    try {
      const comment = await addComment(selected.complaint_id, commentText.trim());
      setSelected((prev) => ({ ...prev, Comments: [...(prev.Comments || []), comment] }));
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selected) return;
    setStatusUpdating(true);
    setStatusMsg('');
    try {
      await staffUpdateStatus(selected.complaint_id, newStatus);
      setStatusMsg(`✅ Status updated to "${newStatus}"`);
      // Refresh detail
      const full = await fetchComplaint(selected.complaint_id);
      setSelected(full);
      load();
    } catch (err) {
      setStatusMsg('❌ ' + (err.response?.data?.message || 'Failed to update status'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const currentStatus = selected?.status?.status_name;
  const canMarkInProgress = currentStatus === 'Assigned';
  const canMarkResolved = currentStatus === 'Assigned' || currentStatus === 'In Progress';

  return (
    <DashboardLayout title="Maintenance Staff Portal" navItems={staffNav}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Tasks</h2>
          <p className="text-sm text-slate-500">
            {pagination ? `${pagination.total} task(s) assigned to you` : '…'}
          </p>
        </div>
        <a href="/staff/report"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
          + Work Report
        </a>
      </div>

      {/* Status filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} type="button"
            onClick={() => { setFilter(s); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              filter === s
                ? 'bg-orange-500 text-white shadow'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}>
            {s === 'all' ? 'All Tasks' : s}
          </button>
        ))}
      </div>

      {/* Task cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div key={c.complaint_id} onClick={() => openDetail(c)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-slate-500">{c.ticket_id}</span>
                  <h3 className="mt-0.5 font-semibold text-slate-800">{c.title}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>📍 {c.Location?.Building?.building_name} — {c.Location?.room_no}</span>
                    <span>🏷️ {c.Category?.category_name}</span>
                    <span>📅 {new Date(c.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={c.priority?.priority_name} />
                  <StatusBadge status={c.status?.status_name} />
                </div>
              </div>
            </div>
          ))}

          {complaints.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500">
              <p className="text-4xl mb-3">🎉</p>
              <p className="font-semibold">No tasks found</p>
              <p className="mt-1 text-sm text-slate-400">Tasks assigned by admin will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                p === page ? 'bg-orange-500 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}>{p}</button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
              <div>
                <span className="font-mono text-xs text-slate-500">{selected.ticket_id}</span>
                <h3 className="mt-0.5 font-bold text-slate-800">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 text-xl leading-none">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                </div>
              ) : (<>
                {/* Status + Priority */}
                <div className="flex gap-2">
                  <PriorityBadge priority={selected.priority?.priority_name} />
                  <StatusBadge status={selected.status?.status_name} />
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <span className="block text-xs font-semibold uppercase text-slate-400">Location</span>
                    {selected.Location?.Building?.building_name} — {selected.Location?.room_no}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase text-slate-400">Category</span>
                    {selected.Category?.category_name}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase text-slate-400">Submitted</span>
                    {new Date(selected.submitted_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase text-slate-400">Assigned</span>
                    {selected.ComplaintAssignment
                      ? new Date(selected.ComplaintAssignment.assigned_at).toLocaleDateString()
                      : '—'}
                  </div>
                </div>

                {selected.description && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Description</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
                  </div>
                )}

                {/* Quick status update */}
                {(canMarkInProgress || canMarkResolved) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Update Status</p>
                    {statusMsg && (
                      <p className={`mb-2 text-xs ${statusMsg.startsWith('✅') ? 'text-emerald-700' : 'text-red-600'}`}>
                        {statusMsg}
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {canMarkInProgress && (
                        <button onClick={() => handleStatusUpdate('In Progress')}
                          disabled={statusUpdating}
                          className="rounded-lg border border-orange-400 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-colors">
                          Mark In Progress
                        </button>
                      )}
                      {canMarkResolved && (
                        <button onClick={() => handleStatusUpdate('Resolved')}
                          disabled={statusUpdating}
                          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors">
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Status history */}
                {selected.StatusHistories?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Status Timeline</p>
                    <div className="space-y-1.5">
                      {selected.StatusHistories.map((h) => (
                        <div key={h.history_id} className="flex items-start gap-2 text-xs">
                          <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                          <div>
                            <span className="font-semibold text-slate-700">
                              {h.oldStatus ? `${h.oldStatus.status_name} → ` : ''}{h.newStatus?.status_name}
                            </span>
                            <span className="ml-1 text-slate-400">· {h.changer?.full_name}</span>
                            {h.remarks && <p className="text-slate-500">{h.remarks}</p>}
                            <p className="text-slate-400">{new Date(h.changed_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Comments</p>
                  <div className="space-y-2 mb-3">
                    {(selected.Comments || []).map((c) => (
                      <div key={c.comment_id} className={`rounded-lg p-3 text-sm ${
                        c.comment_type === 'staff' ? 'bg-orange-50 border border-orange-200' :
                        c.comment_type === 'admin' ? 'bg-purple-50 border border-purple-200' :
                        'bg-slate-50 border border-slate-200'
                      }`}>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-slate-700">{c.author?.full_name}</span>
                          <span className="text-xs text-slate-400">{new Date(c.comment_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600">{c.content}</p>
                      </div>
                    ))}
                    {(selected.Comments || []).length === 0 && (
                      <p className="text-xs text-slate-400 italic">No comments yet.</p>
                    )}
                  </div>
                  <form onSubmit={handleComment} className="flex gap-2">
                    <input type="text" value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a work note or comment…"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400" />
                    <button type="submit" disabled={commentLoading || !commentText.trim()}
                      className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
                      {commentLoading ? '…' : 'Send'}
                    </button>
                  </form>
                </div>
              </>)}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex gap-3 flex-shrink-0">
              <a href="/staff/report"
                className="flex-1 rounded-lg bg-orange-500 py-2.5 text-center text-sm font-bold text-white hover:bg-orange-600 transition-colors">
                Full Work Report
              </a>
              <button onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
