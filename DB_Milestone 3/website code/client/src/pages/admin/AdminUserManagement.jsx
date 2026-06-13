import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  createFiler,
  createStaff,
  fetchLookupData,
  fetchUsers,
  updateUserStatus,
} from '../../services/authService';

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'User Management', icon: '👥' },
  { to: '/admin/complaints', label: 'Complaints', icon: '📋' },
  { to: '/admin/assign', label: 'Assign Work', icon: '🔁' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
];

const emptyFilerForm = {
  full_name: '',
  email: '',
  password: '',
  phone_no: '',
  user_type: 'student',
  university_id: '',
  department_id: '',
};

const emptyStaffForm = {
  full_name: '',
  email: '',
  password: '',
  phone_no: '',
  staff_code: '',
  availability_status: 'available',
  category_ids: [],
};

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('list');
  const [filerForm, setFilerForm] = useState(emptyFilerForm);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    const params = {};
    if (filter !== 'all') params.role_type = filter;
    if (search) params.search = search;
    const data = await fetchUsers(params);
    setUsers(data);
  };

  useEffect(() => {
    loadUsers().catch(console.error);
    fetchLookupData()
      .then(({ departments: d, categories: c }) => {
        setDepartments(d);
        setCategories(c);
      })
      .catch(console.error);
  }, [filter]);

  const handleCreateFiler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createFiler({
        ...filerForm,
        department_id: filerForm.department_id ? Number(filerForm.department_id) : null,
      });
      setMessage('Complaint filer account created successfully.');
      setFilerForm(emptyFilerForm);
      setTab('list');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createStaff({
        ...staffForm,
        category_ids: staffForm.category_ids.map(Number),
      });
      setMessage('Maintenance staff account created successfully.');
      setStaffForm(emptyStaffForm);
      setTab('list');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffCategory = (id) => {
    setStaffForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }));
  };

  const handleStatusChange = async (userId, account_status) => {
    try {
      await updateUserStatus(userId, account_status);
      setMessage(`User status updated to ${account_status}.`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const roleLabel = (role) =>
    ({
      admin: 'Administrator',
      end_user: 'Complaint Filer',
      maintenance_staff: 'Maintenance Staff',
    })[role] || role;

  return (
    <DashboardLayout title="User Management" navItems={adminNav}>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: 'list', label: 'All Users' },
          { id: 'create-filer', label: 'Create Complaint Filer' },
          { id: 'create-staff', label: 'Create Maintenance Staff' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setError('');
              setMessage('');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? 'bg-emerald-700 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {tab === 'list' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={loadUsers}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
            >
              Search
            </button>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All roles</option>
              <option value="end_user">Complaint filers</option>
              <option value="maintenance_staff">Maintenance staff</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">ID / Code</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium">{u.full_name}</td>
                    <td className="px-3 py-3">{u.email}</td>
                    <td className="px-3 py-3">{roleLabel(u.role_type)}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {u.EndUser?.university_id ||
                        u.MaintenanceStaff?.staff_code ||
                        u.Admin?.designation ||
                        '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          u.account_status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {u.account_status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {u.role_type !== 'admin' && (
                        <select
                          value={u.account_status}
                          onChange={(e) => handleStatusChange(u.user_id, e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="suspended">suspended</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'create-filer' && (
        <form
          onSubmit={handleCreateFiler}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold">Create Complaint Filer Account</h2>
          <p className="mb-4 text-sm text-slate-600">
            For students, faculty, or university staff who will submit complaints.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <input
                required
                value={filerForm.full_name}
                onChange={(e) => setFilerForm({ ...filerForm, full_name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                required
                value={filerForm.email}
                onChange={(e) => setFilerForm({ ...filerForm, email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Temporary Password" required>
              <input
                type="password"
                required
                minLength={6}
                value={filerForm.password}
                onChange={(e) => setFilerForm({ ...filerForm, password: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Phone">
              <input
                value={filerForm.phone_no}
                onChange={(e) => setFilerForm({ ...filerForm, phone_no: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="User Type" required>
              <select
                value={filerForm.user_type}
                onChange={(e) => setFilerForm({ ...filerForm, user_type: e.target.value })}
                className="input"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="staff">University Staff</option>
              </select>
            </Field>
            <Field label="University ID" required hint="Format: NUM-BSCS-2024-75">
              <input
                required
                value={filerForm.university_id}
                onChange={(e) => setFilerForm({ ...filerForm, university_id: e.target.value })}
                className="input"
                placeholder="NUM-BSCS-2024-75"
              />
            </Field>
            <Field label="Department">
              <select
                value={filerForm.department_id}
                onChange={(e) => setFilerForm({ ...filerForm, department_id: e.target.value })}
                className="input"
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      )}

      {tab === 'create-staff' && (
        <form
          onSubmit={handleCreateStaff}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold">Create Maintenance Staff Account</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <input
                required
                value={staffForm.full_name}
                onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Temporary Password" required>
              <input
                type="password"
                required
                minLength={6}
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Staff ID" required hint="Format: STAFF-ELEC-001">
              <input
                required
                value={staffForm.staff_code}
                onChange={(e) => setStaffForm({ ...staffForm, staff_code: e.target.value })}
                className="input"
                placeholder="STAFF-ELEC-001"
              />
            </Field>
            <Field label="Phone">
              <input
                value={staffForm.phone_no}
                onChange={(e) => setStaffForm({ ...staffForm, phone_no: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Availability">
              <select
                value={staffForm.availability_status}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, availability_status: e.target.value })
                }
                className="input"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off_duty">Off Duty</option>
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Specializations (categories)</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <label
                  key={c.category_id}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                    staffForm.category_ids.includes(c.category_id)
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={staffForm.category_ids.includes(c.category_id)}
                    onChange={() => toggleStaffCategory(c.category_id)}
                  />
                  {c.category_name}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Staff Account'}
          </button>
        </form>
      )}

      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid #cbd5e1; padding: 0.5rem 0.75rem; font-size: 0.875rem; }`}</style>
    </DashboardLayout>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && ' *'}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
