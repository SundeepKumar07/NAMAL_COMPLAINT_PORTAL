import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Layout';

/* ─── Role cards with images ─── */
const roles = [
  {
    title: 'Administrator',
    description: 'Manage complaints, create accounts, assign maintenance staff, and monitor campus operations.',
    to: '/login/admin',
    cta: 'Admin Login',
    img: '/admin.png',
    icon: '🛡️',
    accent: 'from-purple-600 to-purple-800',
    badge: 'bg-purple-100 text-purple-800',
    ring: 'ring-purple-300',
    hover: 'hover:shadow-purple-200',
  },
  {
    title: 'Maintenance Staff',
    description: 'View assigned tasks, update progress, log work notes, and upload completion photos.',
    to: '/login/staff',
    cta: 'Staff Login',
    img: '/staff.png',
    icon: '🔧',
    accent: 'from-orange-500 to-orange-700',
    badge: 'bg-orange-100 text-orange-800',
    ring: 'ring-orange-300',
    hover: 'hover:shadow-orange-200',
  },
  {
    title: 'Student / Faculty / Staff',
    description: 'Submit maintenance complaints, track resolution status, and rate your experience.',
    to: '/login/user',
    cta: 'User Login',
    img: '/enduser.png',
    icon: '🎓',
    accent: 'from-emerald-600 to-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800',
    ring: 'ring-emerald-300',
    hover: 'hover:shadow-emerald-200',
  },
];

const stats = [
  { label: 'Buildings Covered', value: '8+' },
  { label: 'Issue Categories', value: '7' },
  { label: 'Avg. Resolution', value: '48h' },
  { label: 'Departments', value: '3' },
];

const features = [
  { icon: '📋', title: 'Easy Submission', desc: 'Submit complaints with location, category, priority, and supporting photos in under a minute.' },
  { icon: '🔁', title: 'Real-time Tracking', desc: 'Follow your complaint from Open to Resolved with a full status timeline.' },
  { icon: '👷', title: 'Smart Assignment', desc: 'Admins assign complaints to specialised maintenance staff based on category and availability.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Monitor KPIs, resolution times, and staff performance across the entire campus.' },
  { icon: '🔔', title: 'Live Notifications', desc: 'Get instant in-app notifications when your complaint status changes.' },
  { icon: '⭐', title: 'Feedback System', desc: 'Rate the resolution quality after your complaint is resolved.' },
];

function RoleCard({ role }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <Link to={role.to}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${role.hover}`}>
      {/* Image area */}
      <div className={`relative h-48 bg-gradient-to-br ${role.accent} flex items-center justify-center overflow-hidden`}>
        {!imgErr ? (
          <img
            src={role.img}
            alt={role.title}
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="text-6xl opacity-80">{role.icon}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold ${role.badge}`}>
          {role.cta}
        </span>
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900">{role.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{role.description}</p>
        <div className={`mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${role.accent} px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-shadow group-hover:shadow-md`}>
          {role.cta}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}

function NavLogo() {
  const [err, setErr] = useState(false);
  return err ? (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">N</div>
  ) : (
    <img src="/namal_logo.png" alt="Namal" className="h-9 w-9 object-contain" onError={() => setErr(true)} />
  );
}

export default function HomePage() {
  const [bannerErr, setBannerErr] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <NavLogo />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">NCMMS</p>
              <p className="text-sm font-semibold text-slate-800 leading-tight hidden sm:block">
                Namal Complaint Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login/user" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Student Login
            </Link>
            <Link to="/login/admin" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-sm">
              Admin Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero / Banner ── */}
      <section className="relative min-h-[520px] overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800">
        {/* Background image */}
        {!bannerErr && (
          <img
            src="/banner.png"
            alt="Namal Campus"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            onError={() => setBannerErr(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-800/60 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-6">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100 backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Namal University, Mianwali — Campus Services
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Namal Complaint<br />
              <span className="text-emerald-300">Management System</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-emerald-100 sm:text-xl max-w-xl">
              One platform to report, track and resolve campus maintenance issues — transparently, efficiently and in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login/user"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-800 shadow-lg hover:bg-emerald-50 transition-colors">
                🎓 Submit a Complaint
              </Link>
              <Link to="/login/admin"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
                🛡️ Admin Dashboard
              </Link>
              <Link to="/login/staff"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
                🔧 Staff Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-0 px-4 sm:grid-cols-4 lg:px-6">
            {stats.map((s, i) => (
              <div key={i} className={`py-5 text-center ${i < stats.length - 1 ? 'border-r border-white/10' : ''}`}>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="mt-0.5 text-xs font-medium text-emerald-200">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role selection ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">Select Your Role</h2>
          <p className="mt-3 text-base text-slate-500">
            Choose how you'd like to access the system
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => <RoleCard key={role.to} role={role} />)}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Key Features</h2>
            <p className="mt-3 text-base text-slate-500">
              Everything needed to manage campus maintenance efficiently
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl transition-transform group-hover:scale-110">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
        <div className="mx-auto max-w-5xl px-4 lg:px-6 text-center">
          <h2 className="mb-2 text-3xl font-extrabold text-white">How It Works</h2>
          <p className="mb-10 text-slate-400">From submission to resolution in 4 simple steps</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '01', icon: '📝', title: 'Submit', desc: 'User fills in complaint form with location, category and photos' },
              { step: '02', icon: '👷', title: 'Assign', desc: 'Admin reviews and assigns complaint to the right staff member' },
              { step: '03', icon: '⚙️', title: 'Resolve', desc: 'Staff updates progress, logs work notes and uploads completion photos' },
              { step: '04', icon: '✅', title: 'Close', desc: 'Admin generates resolution report and user submits feedback' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
                <div className="mb-3 text-xs font-bold tracking-widest text-emerald-400">{item.step}</div>
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3 className="font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Account notice ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6">
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <span className="flex-shrink-0 text-2xl">ℹ️</span>
          <div>
            <p className="font-bold text-amber-900">Account Access</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              There is no public self-registration. Accounts for complaint filers (students, faculty, university staff) and
              maintenance staff are created exclusively by the system administrator. Contact your administrator for access.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
