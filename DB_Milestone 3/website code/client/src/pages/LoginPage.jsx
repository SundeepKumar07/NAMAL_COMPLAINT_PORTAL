import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_META = {
  admin:              { icon: '🛡️', img: '/admin.png',   color: 'emerald', accent: 'from-purple-700 to-purple-900',   badge: 'bg-purple-100 text-purple-800',  border: 'focus:border-purple-500 focus:ring-purple-100',  btn: 'bg-purple-700 hover:bg-purple-800' },
  maintenance_staff:  { icon: '🔧', img: '/staff.png',   color: 'orange',  accent: 'from-orange-600 to-orange-800',   badge: 'bg-orange-100 text-orange-800',  border: 'focus:border-orange-500 focus:ring-orange-100',  btn: 'bg-orange-600 hover:bg-orange-700' },
  end_user:           { icon: '🎓', img: '/enduser.png', color: 'emerald', accent: 'from-emerald-700 to-emerald-900', badge: 'bg-emerald-100 text-emerald-800', border: 'focus:border-emerald-500 focus:ring-emerald-100', btn: 'bg-emerald-700 hover:bg-emerald-800' },
};

const DASHBOARD = { admin: '/admin/dashboard', maintenance_staff: '/staff/dashboard', end_user: '/user/dashboard' };

function LogoImg() {
  const [err, setErr] = useState(false);
  if (err) return <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-2xl font-bold text-white shadow-lg">N</div>;
  return <img src="/namal_logo.png" alt="Namal University" className="mx-auto h-14 w-14 object-contain" onError={() => setErr(true)} />;
}

function RoleImg({ src, icon, accent }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accent}`}>
      <span className="text-6xl opacity-80">{icon}</span>
    </div>
  );
  return <img src={src} alt="" className="h-full w-full object-cover" onError={() => setErr(true)} />;
}

export default function LoginPage({ roleType, title, subtitle, identifierField }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', identifier: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const meta = ROLE_META[roleType] || ROLE_META.end_user;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login({ email: form.email, password: form.password, role_type: roleType, identifier: identifierField ? form.identifier : undefined });
      navigate(DASHBOARD[user.role_type] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  const inputBase = `w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${meta.border} focus:ring-2`;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Left panel — image */}
      <div className={`hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden bg-gradient-to-br ${meta.accent}`}>
        <RoleImg src={meta.img} icon={meta.icon} accent={meta.accent} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">NCMMS</p>
          <h2 className="text-3xl font-extrabold leading-tight">{title}</h2>
          <p className="mt-2 text-white/70">{subtitle}</p>
        </div>
        {/* Back link */}
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
          ← Home
        </Link>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Mobile back */}
        <div className="mb-6 w-full max-w-md lg:hidden">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="mb-8 text-center">
            <LogoImg />
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-700">NCMMS</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 lg:hidden">{title}</h1>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 hidden lg:block">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
                <input type="email" required autoComplete="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your.email@namal.edu.pk"
                  className={inputBase} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password"
                    className={`${inputBase} pr-12`} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {identifierField && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">{identifierField.label}</label>
                  <input type="text" required value={form.identifier}
                    onChange={e => setForm({ ...form, identifier: e.target.value })}
                    placeholder={identifierField.placeholder}
                    className={inputBase} />
                  {identifierField.hint && <p className="mt-1.5 text-xs text-slate-500">{identifierField.hint}</p>}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <span className="flex-shrink-0 text-red-500">⚠️</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className={`w-full rounded-xl ${meta.btn} py-3.5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0`}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in…
                  </span>
                ) : 'Login'}
              </button>
            </form>

            {roleType === 'admin' && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Demo credentials: </span>
                  admin@namal.edu.pk / admin123
                </p>
              </div>
            )}

            <p className="mt-5 text-center text-xs text-slate-500">
              No account?{' '}
              <Link to="/" className="font-semibold text-emerald-700 hover:underline">Contact your administrator</Link>
            </p>
          </div>

          {/* Role switch links */}
          <div className="mt-5 flex justify-center gap-4 text-xs text-slate-400">
            {roleType !== 'admin'            && <Link to="/login/admin" className="hover:text-slate-600 hover:underline transition-colors">Admin Login</Link>}
            {roleType !== 'maintenance_staff' && <Link to="/login/staff" className="hover:text-slate-600 hover:underline transition-colors">Staff Login</Link>}
            {roleType !== 'end_user'          && <Link to="/login/user"  className="hover:text-slate-600 hover:underline transition-colors">User Login</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
