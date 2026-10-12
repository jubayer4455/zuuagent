import React, { useState } from 'react';
import { Clock, Play, Pause, Plus, CheckCircle2, Calendar } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';

interface ScheduleEntry {
  id: string;
  agentName: string;
  cron: string;
  timezone: string;
  description: string;
  isActive: boolean;
  nextRun: string;
}

export const SchedulesPage: React.FC = () => {
  const { agents } = useAgentStore();

  const [schedules, setSchedules] = useState<ScheduleEntry[]>([
    {
      id: 'sch-1',
      agentName: 'Trollogiya Content Agent',
      cron: '0 14 * * *',
      timezone: 'Asia/Dhaka (UTC+6)',
      description: 'Daily Afternoon Post Slot (Relatable daily life & rain cravings)',
      isActive: true,
      nextRun: 'Today, 2:00 PM GMT+6'
    },
    {
      id: 'sch-2',
      agentName: 'Trollogiya Content Agent',
      cron: '0 20 * * *',
      timezone: 'Asia/Dhaka (UTC+6)',
      description: 'Daily Prime Evening Slot (Funny & troll viral observation)',
      isActive: true,
      nextRun: 'Today, 8:00 PM GMT+6'
    },
    {
      id: 'sch-3',
      agentName: 'Deep Research Scout',
      cron: '0 8 * * 1',
      timezone: 'UTC',
      description: 'Weekly AI & automation trends synthesis dossier',
      isActive: true,
      nextRun: 'Next Monday, 8:00 AM UTC'
    }
  ]);

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Schedules & Job Triggers</h1>
          <p className="text-slate-400 text-sm mt-1">
            Database-backed scheduled jobs, atomic locking, cron expressions, and next-run previews.
          </p>
        </div>
      </div>

      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 overflow-hidden">
        <div className="divide-y divide-slate-800/70">
          {schedules.map((s) => (
            <div key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-slate-100 text-sm">{s.agentName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {s.cron}
                  </span>
                </div>
                <p className="text-slate-300">{s.description}</p>
                <div className="text-[11px] text-slate-500">
                  Timezone: {s.timezone} • Next Run: <strong className="text-emerald-400">{s.nextRun}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleSchedule(s.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    s.isActive 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {s.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{s.isActive ? 'Active Worker' : 'Paused'}</span>
                </button>

                <button
                  onClick={() => alert(`Triggered manual preview run for: ${s.agentName}`)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold"
                >
                  Run Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
