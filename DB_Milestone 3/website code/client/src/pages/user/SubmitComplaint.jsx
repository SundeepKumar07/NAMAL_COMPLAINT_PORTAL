import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchComplaintLookups, submitComplaint } from '../../services/complaintService';

const userNav = [
  { to: '/user/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/user/submit', label: 'Submit Complaint', icon: '➕' },
  { to: '/user/complaints', label: 'My Complaints', icon: '📋' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  building_id: '',
  location_id: '',
  category_id: '',
  priority_id: '',
};

export default function SubmitComplaint() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [lookups, setLookups] = useState({ categories: [], priorities: [], buildings: [] });
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    fetchComplaintLookups()
      .then(setLookups)
      .catch(() => setError('Failed to load form data. Please refresh.'))
      .finally(() => setLookupLoading(false));
  }, []);

  const selectedBuilding = lookups.buildings.find((b) => b.building_id === Number(form.building_id));

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 3 - images.length;
    const chosen = files.slice(0, remaining);
    setImages((p) => [...p, ...chosen]);
    setPreviews((p) => [...p, ...chosen.map((f) => URL.createObjectURL(f))]);
    // Reset input so same file can be re-selected after removal
    e.target.value = '';
  };

  const removeImage = (i) => {
    URL.revokeObjectURL(previews[i]);
    setImages((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const complaint = await submitComplaint(
        {
          title: form.title,
          description: form.description,
          category_id: Number(form.category_id),
          priority_id: Number(form.priority_id),
          location_id: Number(form.location_id),
        },
        images
      );
      setSubmitted(complaint.ticket_id);
      setForm(EMPTY_FORM);
      setImages([]);
      setPreviews([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setForm(EMPTY_FORM);
    previews.forEach((p) => URL.revokeObjectURL(p));
    setImages([]);
    setPreviews([]);
    setError('');
  };

  if (submitted) {
    return (
      <DashboardLayout title="Complaint Filer Portal" navItems={userNav}>
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✅</div>
          <h2 className="text-2xl font-bold text-slate-800">Complaint Submitted!</h2>
          <p className="mt-2 text-slate-600">Your complaint has been received and assigned a ticket number.</p>
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">Ticket ID</p>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-800">{submitted}</p>
            <p className="mt-2 text-xs text-emerald-600">Save this ID to track your complaint status.</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSubmitted(null)}
              className="rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
            >
              Submit Another
            </button>
            <a
              href="/user/complaints"
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View My Complaints
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Complaint Filer Portal" navItems={userNav}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Submit a New Complaint</h2>
          <p className="mt-0.5 text-sm text-slate-500">Fill in the details and we'll route it to the right team.</p>
        </div>

        {lookupLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Your Info */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-800">Your Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <input value={user?.full_name || ''} readOnly className="input-ro" />
                </Field>
                <Field label="University ID">
                  <input value={user?.profile?.university_id || ''} readOnly className="input-ro" />
                </Field>
                <Field label="Email">
                  <input value={user?.email || ''} readOnly className="input-ro" />
                </Field>
                <Field label="User Type">
                  <input value={user?.profile?.user_type || ''} readOnly className="input-ro capitalize" />
                </Field>
              </div>
            </section>

            {/* Location */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-800">Complaint Location</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Building" required>
                  <select
                    required
                    value={form.building_id}
                    onChange={(e) => setForm({ ...form, building_id: e.target.value, location_id: '' })}
                    className="input"
                  >
                    <option value="">Select building</option>
                    {lookups.buildings.map((b) => (
                      <option key={b.building_id} value={b.building_id}>{b.building_name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Room / Area" required>
                  <select
                    required
                    value={form.location_id}
                    onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                    disabled={!form.building_id}
                    className="input disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Select room / area</option>
                    {(selectedBuilding?.Locations || []).map((l) => (
                      <option key={l.location_id} value={l.location_id}>
                        {l.room_no}{l.floor_no != null ? ` (Floor ${l.floor_no})` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            {/* Complaint Details */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-800">Complaint Details</h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category" required>
                    <select required value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="input">
                      <option value="">Select category</option>
                      {lookups.categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Priority" required>
                    <select required value={form.priority_id}
                      onChange={(e) => setForm({ ...form, priority_id: e.target.value })}
                      className="input">
                      <option value="">Select priority</option>
                      {lookups.priorities.map((p) => (
                        <option key={p.priority_id} value={p.priority_id}>
                          {p.priority_name} — resolve within {p.hours_resolution}h
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Complaint Title" required hint={`${form.title.length}/100`}>
                  <input
                    required maxLength={100} value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Brief description of the issue…"
                    className="input"
                  />
                </Field>

                <Field label="Detailed Description" required hint={`${form.description.length}/1000`}>
                  <textarea
                    required maxLength={1000} rows={5} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the issue in detail — what happened, when it started, and any relevant context…"
                    className="input resize-none"
                  />
                </Field>
              </div>
            </section>

            {/* Images — optional */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 font-semibold text-slate-800">Supporting Photos <span className="text-xs font-normal text-slate-400">(optional)</span></h3>
              <p className="mb-4 text-sm text-slate-500">
                Upload up to 3 photos to help describe the issue. JPEG, PNG or WEBP, max 5 MB each.
              </p>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src} alt={`Preview ${i + 1}`}
                        className="h-24 w-24 rounded-lg border border-slate-200 object-cover shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload trigger */}
              {images.length < 3 && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-5 text-slate-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                  <span className="text-2xl">📷</span>
                  <div>
                    <p className="text-sm font-semibold">Click to add photos</p>
                    <p className="text-xs text-slate-400">
                      {images.length === 0 ? 'Up to 3 photos' : `${3 - images.length} more allowed`}
                    </p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={handleImages}
                  />
                </label>
              )}
            </section>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span>⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-emerald-700 px-8 py-3 text-sm font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting…
                  </span>
                ) : (
                  `Submit Complaint${images.length > 0 ? ` + ${images.length} photo${images.length > 1 ? 's' : ''}` : ''}`
                )}
              </button>
              <button
                type="button"
                onClick={clearForm}
                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Clear Form
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .input {
          width: 100%; border-radius: 0.5rem; border: 1px solid #cbd5e1;
          padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; transition: border-color 0.15s;
        }
        .input:focus { border-color: #059669; box-shadow: 0 0 0 2px #d1fae5; }
        .input-ro {
          width: 100%; border-radius: 0.5rem; border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #f8fafc;
          color: #64748b; cursor: not-allowed;
        }
      `}</style>
    </DashboardLayout>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-right text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
