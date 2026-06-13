import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { fetchStaffTasks } from '../../services/staffService';
import { staffUpdateStatus, addWorkLog, uploadProgressImages } from '../../services/staffService';

const staffNav = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/staff/complaints', label: 'My Tasks', icon: '📋' },
  { to: '/staff/report', label: 'Work Report', icon: '📝' },
];

export default function StaffReport() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [newStatus, setNewStatus] = useState('In Progress');
  const [workNote, setWorkNote] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const today = new Date().toLocaleDateString('en-PK', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const loadTasks = () => {
    setTasksLoading(true);
    Promise.all([
      fetchStaffTasks({ status: 'Assigned', page: 1 }),
      fetchStaffTasks({ status: 'In Progress', page: 1 }),
    ])
      .then(([a, b]) => setTasks([...a.complaints, ...b.complaints]))
      .catch(console.error)
      .finally(() => setTasksLoading(false));
  };

  useEffect(() => { loadTasks(); }, []);

  const selectedTask = tasks.find((t) => t.complaint_id === selectedId);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 3 - images.length;
    const chosen = files.slice(0, remaining);
    setImages((p) => [...p, ...chosen]);
    setPreviews((p) => [...p, ...chosen.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i) => {
    setImages((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      // 1. Add work log
      if (workNote.trim()) {
        await addWorkLog(selectedId, workNote.trim());
      }
      // 2. Upload images (if any)
      if (images.length > 0) {
        await uploadProgressImages(selectedId, images);
      }
      // 3. Update status via staff-specific endpoint
      await staffUpdateStatus(selectedId, newStatus, workNote.trim());

      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setSelectedId('');
    setWorkNote('');
    setNewStatus('In Progress');
    setImages([]);
    setPreviews([]);
    setError('');
    loadTasks();
  };

  if (submitted) {
    return (
      <DashboardLayout title="Maintenance Staff Portal" navItems={staffNav}>
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">✅</div>
          <h2 className="text-2xl font-bold text-slate-800">Report Submitted!</h2>
          <p className="mt-2 text-slate-600">Work log saved and status updated successfully.</p>
          <button onClick={reset}
            className="mt-6 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
            Submit Another Report
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Maintenance Staff Portal" navItems={staffNav}>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Submit Work Report</h2>
        <p className="text-sm text-slate-500">Log progress, update status and upload photos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Select complaint */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-700">Select Assigned Complaint</h3>
            {tasksLoading ? (
              <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
            ) : (
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                <option value="">— Select a complaint —</option>
                {tasks.map((t) => (
                  <option key={t.complaint_id} value={t.complaint_id}>
                    {t.ticket_id} — {t.title}
                  </option>
                ))}
                {tasks.length === 0 && <option disabled>No active tasks assigned to you</option>}
              </select>
            )}

            {selectedTask && (
              <div className="mt-3 space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category</span>
                  <span className="font-semibold">{selectedTask.Category?.category_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location</span>
                  <span className="font-semibold text-right">
                    {selectedTask.Location?.Building?.building_name} — {selectedTask.Location?.room_no}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Status</span>
                  <StatusBadge status={selectedTask.status?.status_name} />
                </div>
              </div>
            )}
          </div>

          {/* Status update */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-700">Update Status</h3>
            <div className="flex gap-3">
              {['In Progress', 'Resolved'].map((s) => (
                <label key={s}
                  className={`flex-1 cursor-pointer rounded-lg border-2 px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                    newStatus === s
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  <input type="radio" name="status" value={s}
                    checked={newStatus === s} onChange={() => setNewStatus(s)} className="sr-only" />
                  {s}
                </label>
              ))}
            </div>
            {newStatus === 'Resolved' && (
              <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ✅ Admin will be notified and can then generate the final resolution report.
              </p>
            )}
          </div>

          {/* Work notes */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-700">Work Notes</h3>
            <textarea required rows={5} value={workNote}
              onChange={(e) => setWorkNote(e.target.value)}
              placeholder="Describe the work performed, materials used, and any next steps…"
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          </div>

          {/* Image upload */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 font-semibold text-slate-700">Progress Photos</h3>
            <p className="mb-3 text-xs text-slate-500">Upload up to 3 photos showing the work done.</p>

            {previews.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover border border-slate-200" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 3 && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-3 text-sm text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors">
                <span className="text-xl">📷</span>
                <span>Click to add photos</span>
                <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only"
                  onChange={handleImages} />
              </label>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          <button type="submit"
            disabled={loading || !selectedId || !workNote.trim()}
            className="w-full rounded-lg bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting…
              </span>
            ) : 'Submit Work Report'}
          </button>
        </form>

        {/* ── Live preview ── */}
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Report Preview</h3>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 border-b border-slate-300 pb-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">NCMMS</p>
              <p className="text-sm font-bold text-slate-800">Namal University — Maintenance Work Report</p>
              <p className="mt-0.5 text-xs text-slate-500">{today}</p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Staff Name: </span>
                <span className="font-semibold">{user?.full_name || '—'}</span></div>
              <div><span className="text-slate-500">Staff ID: </span>
                <span className="font-mono font-semibold">{user?.profile?.staff_code || '—'}</span></div>
            </div>

            {selectedTask ? (
              <div className="mb-4 space-y-1.5 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                <div><span className="text-slate-500">Ticket: </span>
                  <span className="font-mono font-semibold">{selectedTask.ticket_id}</span></div>
                <div><span className="text-slate-500">Category: </span>
                  <span className="font-semibold">{selectedTask.Category?.category_name}</span></div>
                <div><span className="text-slate-500">Title: </span>
                  <span className="font-semibold">{selectedTask.title}</span></div>
                <div><span className="text-slate-500">Location: </span>
                  <span className="font-semibold">
                    {selectedTask.Location?.Building?.building_name} — {selectedTask.Location?.room_no}
                  </span></div>
              </div>
            ) : (
              <div className="mb-4 rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
                Select a complaint to populate details
              </div>
            )}

            <div className="mb-4 flex items-center gap-2 text-xs">
              <span className="text-slate-500">New Status:</span>
              <StatusBadge status={newStatus} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Work Notes</p>
              <p className="min-h-[60px] whitespace-pre-wrap text-xs text-slate-700">
                {workNote || <span className="italic text-slate-400">Work notes will appear here…</span>}
              </p>
            </div>

            {previews.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Photos ({previews.length})</p>
                <div className="flex gap-2 flex-wrap">
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt="" className="h-16 w-16 rounded object-cover border border-slate-200" />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-between border-t border-dashed border-slate-300 pt-3 text-xs text-slate-400">
              <span>Staff Signature: __________</span>
              <span>Date: {today}</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">Preview updates as you fill the form</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
