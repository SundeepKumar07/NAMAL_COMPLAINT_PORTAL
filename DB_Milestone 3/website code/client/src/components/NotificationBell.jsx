import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell() {
  const ctx = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!ctx) return null;
  const { notifications, unreadCount, loading, markAll, markOne } = ctx;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)} aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm">
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <span className="font-bold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAll} className="text-xs font-semibold text-emerald-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="py-10 text-center">
                <span className="text-3xl">🔔</span>
                <p className="mt-2 text-sm text-slate-400">No notifications yet</p>
              </div>
            )}
            {notifications.map(n => (
              <div key={n.notification_id}
                onClick={() => !n.is_read && markOne(n.notification_id)}
                className={`cursor-pointer border-b border-slate-50 px-4 py-3 text-sm transition-colors hover:bg-slate-50 ${!n.is_read ? 'bg-emerald-50/60' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${!n.is_read ? 'bg-emerald-500' : 'bg-transparent'}`} />
                  <div>
                    <p className={`leading-snug ${!n.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 text-center">
            <p className="text-xs text-slate-400">NCMMS Notifications</p>
          </div>
        </div>
      )}
    </div>
  );
}
