const PALETTE = {
  emerald: { card: 'bg-emerald-50 border-emerald-200', value: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600', label: 'text-emerald-600' },
  blue:    { card: 'bg-blue-50 border-blue-200',       value: 'text-blue-700',    icon: 'bg-blue-100 text-blue-600',       label: 'text-blue-600'    },
  orange:  { card: 'bg-orange-50 border-orange-200',   value: 'text-orange-700',  icon: 'bg-orange-100 text-orange-600',   label: 'text-orange-600'  },
  purple:  { card: 'bg-purple-50 border-purple-200',   value: 'text-purple-700',  icon: 'bg-purple-100 text-purple-600',   label: 'text-purple-600'  },
  red:     { card: 'bg-red-50 border-red-200',         value: 'text-red-700',     icon: 'bg-red-100 text-red-600',         label: 'text-red-600'     },
  slate:   { card: 'bg-white border-slate-200',        value: 'text-slate-800',   icon: 'bg-slate-100 text-slate-600',     label: 'text-slate-500'   },
};

export default function StatCard({ label, value, color = 'slate', icon }) {
  const p = PALETTE[color] || PALETTE.slate;
  return (
    <div className={`rounded-xl border ${p.card} p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-wide ${p.label} truncate`}>{label}</p>
          <p className={`mt-2 text-2xl font-extrabold leading-none ${p.value}`}>{value ?? '—'}</p>
        </div>
        {icon && (
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${p.icon} text-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
