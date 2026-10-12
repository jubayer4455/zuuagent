import React from 'react';
import { Bell, Check, Trash2, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useSystemStore } from '../store/useSystemStore';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead, clearNotifications } = useSystemStore();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Notifications & Alerts</h1>
          <p className="text-slate-400 text-sm mt-1">
            System health alerts, pending approvals, provider quota signals, and failure notices.
          </p>
        </div>

        <button
          onClick={clearNotifications}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 divide-y divide-slate-800/70 overflow-hidden text-xs">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No active notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationAsRead(n.id)}
              className={`p-4 flex items-start justify-between gap-4 hover:bg-slate-800/40 cursor-pointer transition ${
                !n.isRead ? 'bg-cyan-950/20' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200">{n.title}</span>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  )}
                </div>
                <p className="text-slate-400 leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleTimeString()}</div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                n.level === 'warning' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {n.level}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
