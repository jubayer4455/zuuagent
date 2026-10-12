import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot, Headphones, Search, FileText, Calendar, BarChart2, Plus } from 'lucide-react';

export const AgentTemplatesPage: React.FC = () => {
  const navigate = useNavigate();

  const templates = [
    {
      id: 'trollogiya',
      name: 'Trollogiya Content Agent',
      category: 'Facebook Publishing & Viral Entertainment',
      description: 'Bangladeshi Bengali & Banglish viral content creator specializing in witty humor, relatable daily life, emotional storytelling, and Facebook Page automated publishing.',
      icon: Sparkles,
      recommended: true,
      features: ['Bangladeshi Bengali & Banglish', 'Humor Scale 1-10', '3 Daily Posts Default', 'Meta Graph API Publisher']
    },
    {
      id: 'support',
      name: 'Customer Support Agent',
      category: 'Customer Operations',
      description: '24/7 multilingual ticket classification, order tracking, and polite escalation routing.',
      icon: Headphones,
      features: ['SLA Enforcement', 'Database Query Tool', 'Escalation Triggers']
    },
    {
      id: 'research',
      name: 'Deep Research Agent',
      category: 'Market & Tech Intelligence',
      description: 'Conducts autonomous deep web investigations, summarizes tech developments, and outputs cited intelligence dossiers.',
      icon: Search,
      features: ['Web Search Tool', 'Citation Verification', 'Structured Dossiers']
    },
    {
      id: 'document',
      name: 'Document Processing Agent',
      category: 'Enterprise Data',
      description: 'Extracts critical clauses, analyzes regulatory risks, parses PDF tables, and indexes files into Knowledge Base.',
      icon: FileText,
      features: ['PDF Clause Extraction', 'Table Parsing', 'Knowledge Base Sync']
    },
    {
      id: 'scheduler',
      name: 'Scheduled Task Agent',
      category: 'System Automation',
      description: 'Executes persistent recurring cron workflows, webhook dispatching, and database reconciliations.',
      icon: Calendar,
      features: ['Cron Engine', 'Webhook Dispatcher', 'Idempotency Keys']
    },
    {
      id: 'analytics',
      name: 'Data Analysis Agent',
      category: 'Business Intelligence',
      description: 'Transforms raw CSV/JSON metrics into narrative executive summaries and anomaly reports.',
      icon: BarChart2,
      features: ['Anomaly Detection', 'Metric Summaries', 'Report Generator']
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Agent Templates Gallery</h1>
        <p className="text-slate-400 text-sm mt-1">
          Production-tested multi-agent template configurations. Instantly deployable or customizable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tpl) => {
          const Icon = tpl.icon;

          return (
            <div
              key={tpl.id}
              className={`border rounded-2xl p-6 flex flex-col justify-between transition ${
                tpl.recommended 
                  ? 'border-cyan-500/60 bg-[#0f172a] shadow-xl shadow-cyan-950/30' 
                  : 'border-slate-800 bg-[#0f172a]/90 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center text-cyan-400 font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  {tpl.recommended && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Flagship Template
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-100 text-base">{tpl.name}</h3>
                  <span className="text-[11px] text-cyan-400 font-medium">{tpl.category}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {tpl.description}
                </p>

                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  {tpl.features.map(f => (
                    <div key={f} className="text-[11px] text-slate-300 flex items-center space-x-1.5">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-slate-800/80 mt-4">
                <button
                  onClick={() => navigate('/agents/new')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-slate-700 transition"
                >
                  Use Template in Builder
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
