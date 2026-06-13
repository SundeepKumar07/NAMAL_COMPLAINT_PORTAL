import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ className = 'h-10' }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`inline-flex items-center justify-center rounded-lg bg-emerald-700 font-bold text-white px-3 py-1.5 text-sm ${className}`}>
        NAMAL
      </div>
    );
  }

  return (
    <img
      src="/namal_logo.png"
      alt="Namal University"
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}

export function LogoFallback({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo className="h-10 w-10" />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-5 text-center text-sm text-slate-500">
      <p className="font-medium text-slate-700">© 2025 Namal University, Mianwali</p>
      <p className="mt-1 text-xs">Developed by Dev Wizard Team</p>
    </footer>
  );
}

export function PageShell({ children, className = '' }) {
  return (
    <div className={`flex min-h-screen flex-col bg-slate-50 ${className}`}>
      {children}
      <Footer />
    </div>
  );
}

export function BackHomeLink() {
  return (
    <Link to="/" className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
      ← Back to Home
    </Link>
  );
}
