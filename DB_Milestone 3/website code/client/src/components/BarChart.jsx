export default function BarChart({ title, items = [] }) {
  const max = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {title && (
        <h3 className="mb-5 text-sm font-bold text-slate-700">{title}</h3>
      )}
      <div className="space-y-3.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs font-semibold text-slate-700">{item.label}</span>
              <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                {item.value}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all duration-700 ease-out ${item.color || 'bg-emerald-500'}`}
                style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">No data available</p>
        )}
      </div>
    </div>
  );
}
