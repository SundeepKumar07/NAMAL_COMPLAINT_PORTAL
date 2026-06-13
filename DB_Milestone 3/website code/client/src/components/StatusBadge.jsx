const STATUS_STYLES = {
  open:        'bg-blue-100 text-blue-800 border border-blue-200',
  assigned:    'bg-violet-100 text-violet-800 border border-violet-200',
  in_progress: 'bg-amber-100 text-amber-800 border border-amber-200',
  resolved:    'bg-emerald-100 text-emerald-800 border border-emerald-200',
  closed:      'bg-slate-100 text-slate-700 border border-slate-200',
};

const STATUS_DOTS = {
  open:        'bg-blue-500',
  assigned:    'bg-violet-500',
  in_progress: 'bg-amber-500',
  resolved:    'bg-emerald-500',
  closed:      'bg-slate-400',
};

const PRIORITY_STYLES = {
  low:      'bg-slate-100 text-slate-700 border border-slate-200',
  medium:   'bg-sky-100 text-sky-800 border border-sky-200',
  high:     'bg-orange-100 text-orange-800 border border-orange-200',
  critical: 'bg-red-100 text-red-800 border border-red-200',
};

export function StatusBadge({ status }) {
  if (!status) return null;
  const key = status.toLowerCase().replace(' ', '_');
  const style = STATUS_STYLES[key] || 'bg-slate-100 text-slate-600 border border-slate-200';
  const dot   = STATUS_DOTS[key]   || 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  const key = priority.toLowerCase();
  const style = PRIORITY_STYLES[key] || 'bg-slate-100 text-slate-600 border border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {priority}
    </span>
  );
}
