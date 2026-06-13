import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { fetchComplaints, fetchComplaint, addComment, cancelComplaint } from '../../services/complaintService';
import { submitFeedback, getFeedback } from '../../services/reportService';

const userNav = [
  { to: '/user/dashboard',  label: 'Dashboard',       icon: '📊' },
  { to: '/user/submit',     label: 'Submit Complaint', icon: '➕' },
  { to: '/user/complaints', label: 'My Complaints',    icon: '📋' },
];

const STATUSES = ['all','Open','Assigned','In Progress','Resolved','Closed'];

function Skeleton() { return <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />; }

export default function UserComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter]   = useState('all');
  const [page,   setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentText, setCommentText]     = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText,   setFeedbackText]   = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackData,    setFeedbackData]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = { page };
      if (filter !== 'all') p.status = filter;
      const d = await fetchComplaints(p);
      setComplaints(d.complaints);
      setPagination(d.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, page]);

  const openDetail = async (c) => {
    setDetailLoading(true); setSelected(c);
    setFeedbackRating(0); setFeedbackText(''); setFeedbackData(null); setCommentText('');
    try {
      const full = await fetchComplaint(c.complaint_id);
      setSelected(full);
      if (['Resolved','Closed'].includes(full.status?.status_name)) {
        const fb = await getFeedback(c.complaint_id);
        setFeedbackData(fb);
      }
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault(); if (!commentText.trim() || !selected) return;
    setCommentLoading(true);
    try {
      const c = await addComment(selected.complaint_id, commentText.trim());
      setSelected(p => ({ ...p, Comments: [...(p.Comments || []), c] }));
      setCommentText('');
    } catch (e) { console.error(e); }
    finally { setCommentLoading(false); }
  };

  const handleFeedback = async (e) => {
    e.preventDefault(); if (!feedbackRating || !selected) return;
    setFeedbackLoading(true);
    try {
      const res = await submitFeedback(selected.complaint_id, feedbackRating, feedbackText);
      setFeedbackData(res.feedback);
    } catch (e) { alert(e.response?.data?.message || 'Failed to submit feedback'); }
    finally { setFeedbackLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this complaint? This cannot be undone.')) return;
    try { await cancelComplaint(id); setSelected(null); load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to cancel'); }
  };

  return (
    <DashboardLayout title="Complaint Filer Portal" navItems={userNav}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Complaints</h1>
          <p className="mt-0.5 text-sm text-slate-500">{pagination ? `${pagination.total} complaint(s)` : '…'}</p>
        </div>
        <Link to="/user/submit" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 shadow-sm transition-colors">
          + New Complaint
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} type="button" onClick={() => { setFilter(s); setPage(1); }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filter === s ? 'bg-emerald-700 text-white shadow' : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} />)}</div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <button key={c.complaint_id} type="button" onClick={() => openDetail(c)} className="w-full text-left">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-slate-400">{c.ticket_id}</span>
                    <h3 className="mt-0.5 font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">{c.title}</h3>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-slate-400">
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
            </button>
          ))}
          {complaints.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
              <span className="text-4xl">📭</span>
              <p className="mt-3 font-semibold text-slate-700">No complaints found</p>
              <Link to="/user/submit" className="mt-4 inline-block rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
                Submit your first complaint →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-emerald-700 text-white shadow' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
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
                <h3 className="mt-0.5 font-bold text-slate-800">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 text-lg leading-none transition-colors">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {detailLoading ? (
                <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
              ) : (<>
                <div className="flex gap-2">
                  <PriorityBadge priority={selected.priority?.priority_name} />
                  <StatusBadge status={selected.status?.status_name} />
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <div><span className="block text-xs font-semibold uppercase text-slate-400 mb-0.5">Location</span>{selected.Location?.Building?.building_name} — {selected.Location?.room_no}</div>
                  <div><span className="block text-xs font-semibold uppercase text-slate-400 mb-0.5">Category</span>{selected.Category?.category_name}</div>
                  <div><span className="block text-xs font-semibold uppercase text-slate-400 mb-0.5">Submitted</span>{new Date(selected.submitted_at).toLocaleString()}</div>
                  {selected.ComplaintAssignment && (
                    <div><span className="block text-xs font-semibold uppercase text-slate-400 mb-0.5">Assigned To</span>{selected.ComplaintAssignment?.assignee?.User?.full_name || '—'}</div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Description</p>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
                </div>

                {/* Images */}
                {selected.ComplaintImages?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Attached Photos</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.ComplaintImages.map(img => (
                        <a key={img.image_id} href={img.image_url} target="_blank" rel="noreferrer">
                          <img src={img.image_url} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200 hover:opacity-90 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status timeline */}
                {selected.StatusHistories?.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-slate-400">Status Timeline</p>
                    <div className="space-y-2 border-l-2 border-slate-200 pl-4">
                      {selected.StatusHistories.map(h => (
                        <div key={h.history_id} className="text-xs relative">
                          <div className="absolute -left-5 top-1 h-2 w-2 rounded-full bg-emerald-500 border-2 border-white" />
                          <span className="font-semibold text-slate-700">{h.oldStatus ? `${h.oldStatus.status_name} → ` : ''}{h.newStatus?.status_name}</span>
                          <span className="ml-2 text-slate-400">by {h.changer?.full_name}</span>
                          {h.remarks && <p className="text-slate-500 mt-0.5">{h.remarks}</p>}
                          <p className="text-slate-400">{new Date(h.changed_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {['Resolved','Closed'].includes(selected.status?.status_name) && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-slate-400">Your Feedback</p>
                    {feedbackData ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-800 mb-2">Thank you for your feedback!</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-xl ${i < feedbackData.rating ? 'text-yellow-400' : 'text-slate-300'}`}>★</span>
                          ))}
                          <span className="ml-2 text-sm text-slate-600">{feedbackData.rating}/5</span>
                        </div>
                        {feedbackData.feedback_text && <p className="mt-1.5 text-sm text-slate-600">{feedbackData.feedback_text}</p>}
                      </div>
                    ) : (
                      <form onSubmit={handleFeedback} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <p className="text-sm text-slate-600">How was this complaint handled?</p>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} type="button" onClick={() => setFeedbackRating(star)}
                              className={`text-2xl transition-transform hover:scale-110 ${star <= feedbackRating ? 'text-yellow-400' : 'text-slate-300'}`}>★</button>
                          ))}
                          {feedbackRating > 0 && <span className="ml-2 self-center text-sm text-slate-500">{feedbackRating}/5</span>}
                        </div>
                        <textarea rows={2} value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                          placeholder="Optional: share your experience…"
                          className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        <button type="submit" disabled={feedbackLoading || feedbackRating === 0}
                          className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors">
                          {feedbackLoading ? 'Submitting…' : 'Submit Feedback'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-slate-400">Comments</p>
                  <div className="mb-3 space-y-2">
                    {(selected.Comments || []).map(c => (
                      <div key={c.comment_id} className={`rounded-xl p-3 text-sm ${c.comment_type === 'user' ? 'bg-slate-50 border border-slate-200' : c.comment_type === 'admin' ? 'bg-purple-50 border border-purple-200' : 'bg-orange-50 border border-orange-200'}`}>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-slate-700">{c.author?.full_name}</span>
                          <span className="text-xs text-slate-400">{new Date(c.comment_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600">{c.content}</p>
                      </div>
                    ))}
                    {!(selected.Comments?.length) && <p className="text-xs text-slate-400 italic">No comments yet.</p>}
                  </div>
                  {selected.status?.status_name !== 'Closed' && (
                    <form onSubmit={handleComment} className="flex gap-2">
                      <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                        placeholder="Add a comment…"
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                      <button type="submit" disabled={commentLoading || !commentText.trim()}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors">
                        {commentLoading ? '…' : 'Send'}
                      </button>
                    </form>
                  )}
                </div>
              </>)}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex gap-3 flex-shrink-0">
              {selected.status?.status_name === 'Open' && (
                <button onClick={() => handleCancel(selected.complaint_id)}
                  className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  Cancel
                </button>
              )}
              <button onClick={() => setSelected(null)}
                className="ml-auto rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
