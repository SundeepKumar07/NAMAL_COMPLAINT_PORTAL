import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import BarChart from '../../components/BarChart';
import { StatusBadge } from '../../components/StatusBadge';
import {
  fetchAnalytics,
  fetchResolvedComplaints,
  fetchResolutionReport,
  createResolution,
} from '../../services/reportService';

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'User Management', icon: '👥' },
  { to: '/admin/complaints', label: 'Complaints', icon: '📋' },
  { to: '/admin/assign', label: 'Assign Work', icon: '🔁' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
];

const CATEGORY_COLORS = ['bg-yellow-400','bg-blue-400','bg-orange-400','bg-purple-400','bg-emerald-400','bg-pink-400','bg-slate-400'];
const PRIORITY_COLORS = { Critical: 'bg-red-500', High: 'bg-orange-400', Medium: 'bg-blue-400', Low: 'bg-slate-400' };

export default function AdminReports() {
  const [analytics, setAnalytics] = useState(null);
  const [resolved, setResolved] = useState([]);
  const [resolvedPagination, setResolvedPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  // Resolution modal
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveMsg, setResolveMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const [a, r] = await Promise.all([
        fetchAnalytics(params),
        fetchResolvedComplaints({ ...params, page }),
      ]);
      setAnalytics(a);
      setResolved(r.complaints);
      setResolvedPagination(r.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [from, to, page]);

  const openReport = async (c) => {
    setReportData(null);
    setResolveMsg('');
    setSummary('');
    setReportLoading(true);
    try {
      const data = await fetchResolutionReport(c.complaint_id);
      setReportData(data);
    } catch (err) { console.error(err); }
    finally { setReportLoading(false); }
  };

  const handleCreateResolution = async () => {
    if (!summary.trim() || !reportData) return;
    setResolving(true);
    try {
      await createResolution(reportData.complaint_id, summary.trim());
      setResolveMsg('✅ Resolution created. Complaint is now Closed.');
      load();
      // Refresh report data
      const data = await fetchResolutionReport(reportData.complaint_id);
      setReportData(data);
    } catch (err) {
      setResolveMsg('❌ ' + (err.response?.data?.message || 'Failed'));
    } finally { setResolving(false); }
  };

  const catItems = (analytics?.byCategory || []).map((c, i) => ({
    ...c, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
  const priItems = (analytics?.byPriority || []).map((p) => ({
    ...p, color: PRIORITY_COLORS[p.label] || 'bg-slate-400',
  }));

  return (
    <DashboardLayout title="Administrator Portal" navItems={adminNav}>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">System-wide performance and resolution management</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2 items-center">
          <label className="text-xs text-slate-600 font-medium">From</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500" />
          <label className="text-xs text-slate-600 font-medium">To</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500" />
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo(''); setPage(1); }}
              className="text-xs text-red-600 hover:underline">Clear</button>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {loading ? Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
        )) : (<>
          <StatCard label="Total" value={analytics?.total ?? 0} color="slate" icon="📋" />
          <StatCard label="Open" value={analytics?.stats?.open ?? 0} color="blue" icon="🔓" />
          <StatCard label="Assigned" value={analytics?.stats?.assigned ?? 0} color="purple" icon="👷" />
          <StatCard label="In Progress" value={analytics?.stats?.in_progress ?? 0} color="orange" icon="⚙️" />
          <StatCard label="Resolved" value={analytics?.stats?.resolved ?? 0} color="emerald" icon="✅" />
          <StatCard label="Closed" value={analytics?.stats?.closed ?? 0} color="slate" icon="🔒" />
          <StatCard
            label="Avg Hours"
            value={analytics?.stats?.avg_resolution_hours != null ? `${analytics.stats.avg_resolution_hours}h` : '—'}
            color="slate" icon="⏱️" />
        </>)}
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        {loading ? (<>
          <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
        </>) : (<>
          <BarChart title="Complaints by Category" items={catItems} />
          <BarChart title="Complaints by Priority" items={priItems} />
        </>)}
      </div>

      {/* Staff performance */}
      {!loading && analytics?.staffPerformance?.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-800">Staff Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Staff Code</th>
                  <th className="px-5 py-3">Total Assigned</th>
                  <th className="px-5 py-3">Current Workload</th>
                </tr>
              </thead>
              <tbody>
                {analytics.staffPerformance.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium">{s.staff_name || '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs">{s.staff_code || '—'}</td>
                    <td className="px-5 py-3">{s.total_assigned}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.current_workload === 0 ? 'bg-emerald-100 text-emerald-700' :
                        s.current_workload <= 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>{s.current_workload}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolved complaints — generate resolution */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Resolved &amp; Closed Complaints</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click a complaint to view details and generate the final resolution report.
          </p>
        </div>
        {loading ? (
          <div className="space-y-2 p-5">
            {[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Resolution</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((c) => (
                  <tr key={c.complaint_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{c.ticket_id}</td>
                    <td className="px-5 py-3 font-medium max-w-[180px] truncate">{c.title}</td>
                    <td className="px-5 py-3 text-slate-600">{c.Category?.category_name}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.ComplaintAssignment?.assignee?.User?.full_name || '—'}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={c.status?.status_name} /></td>
                    <td className="px-5 py-3">
                      {c.Resolution ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Done</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openReport(c)}
                        className="rounded-lg border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">
                        View / Generate
                      </button>
                    </td>
                  </tr>
                ))}
                {resolved.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No resolved complaints found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {resolvedPagination && resolvedPagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            {Array.from({ length: resolvedPagination.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  p === page ? 'bg-emerald-700 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Resolution report modal */}
      {(reportData !== null || reportLoading) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
              <h3 className="font-bold text-slate-800">Resolution Report</h3>
              <button onClick={() => setReportData(null)}
                className="text-slate-500 hover:text-slate-700 text-xl">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              {reportLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                </div>
              ) : reportData && (<>
                {/* Complaint summary */}
                <div className="mb-4 space-y-1 text-sm">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-xs text-slate-500">{reportData.ticket_id}</span>
                    <StatusBadge status={reportData.status?.status_name} />
                  </div>
                  <p className="font-semibold text-slate-800 text-base">{reportData.title}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                    <div><span className="text-slate-400">Category: </span>{reportData.Category?.category_name}</div>
                    <div><span className="text-slate-400">Priority: </span>{reportData.priority?.priority_name}</div>
                    <div><span className="text-slate-400">Location: </span>
                      {reportData.Location?.Building?.building_name} — {reportData.Location?.room_no}</div>
                    <div><span className="text-slate-400">Submitted by: </span>{reportData.submitter?.full_name}</div>
                    <div><span className="text-slate-400">Assigned to: </span>
                      {reportData.ComplaintAssignment?.assignee?.User?.full_name || '—'}</div>
                    <div><span className="text-slate-400">Submitted: </span>
                      {new Date(reportData.submitted_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Work logs */}
                {reportData.WorkLogs?.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Work Logs</p>
                    <div className="space-y-2">
                      {reportData.WorkLogs.map((w) => (
                        <div key={w.worklog_id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold">{w.staff?.User?.full_name}</span>
                            <span className="text-slate-400">{new Date(w.logged_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 whitespace-pre-wrap">{w.work_note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress images */}
                {reportData.ComplaintImages?.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      Images ({reportData.ComplaintImages.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {reportData.ComplaintImages.map((img) => (
                        <img key={img.image_id} src={img.image_url} alt=""
                          className="h-24 w-24 rounded-lg object-cover border border-slate-200" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {reportData.Feedback && (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    <p className="font-semibold text-emerald-800 mb-1">User Feedback</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < reportData.Feedback.rating ? 'text-yellow-400' : 'text-slate-300'}>★</span>
                      ))}
                      <span className="ml-2 text-xs text-slate-600">{reportData.Feedback.rating}/5</span>
                    </div>
                    {reportData.Feedback.feedback_text && (
                      <p className="mt-1 text-xs text-emerald-700">{reportData.Feedback.feedback_text}</p>
                    )}
                  </div>
                )}

                {/* Existing resolution */}
                {reportData.Resolution ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-semibold text-emerald-800">✅ Resolution on record</p>
                    <p className="mt-1 text-sm text-emerald-700">{reportData.Resolution.resolution_summary}</p>
                    <p className="mt-1 text-xs text-emerald-600">
                      {new Date(reportData.Resolution.resolved_at).toLocaleDateString()}
                    </p>
                  </div>
                ) : reportData.status?.status_name === 'Resolved' ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Generate Resolution Report</p>
                    <textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)}
                      placeholder="Summarise what was done, parts replaced, outcome…"
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 mb-3" />
                    {resolveMsg && (
                      <p className={`mb-2 text-sm ${resolveMsg.startsWith('✅') ? 'text-emerald-700' : 'text-red-600'}`}>
                        {resolveMsg}
                      </p>
                    )}
                    <button onClick={handleCreateResolution}
                      disabled={resolving || !summary.trim()}
                      className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors">
                      {resolving ? 'Generating…' : 'Generate Resolution & Close Complaint'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    Complaint must be in Resolved status before generating a resolution report.
                  </p>
                )}
              </>)}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex-shrink-0">
              <button onClick={() => setReportData(null)}
                className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
