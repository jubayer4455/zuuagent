import React from 'react';
import { Store, Download, CheckCircle2, Star } from 'lucide-react';

export const AgentMarketplacePage: React.FC = () => {
  const marketplaceAgents = [
    {
      id: 'm-troll',
      name: 'Trollogiya Viral Publisher Pro',
      author: 'Zuu Agent Official',
      rating: 4.9,
      downloads: '1.2k',
      installed: true,
      description: 'The proven Bangladeshi viral social media content creation suite with Meta Graph API.'
    },
    {
      id: 'm-ecommerce',
      name: 'E-Commerce Order & Return Triage',
      author: 'Zuu Agent Community',
      rating: 4.8,
      downloads: '850',
      installed: false,
      description: 'Automates customer return requests, courier status polling, and CRM ticket handoffs.'
    },
    {
      id: 'm-seo',
      name: 'Bangla SEO & Blog Drafter',
      author: 'Zuu Agent Official',
      rating: 4.7,
      downloads: '640',
      installed: false,
      description: 'Writes optimized Bengali blog articles with rich meta descriptions and keyword densities.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Agent Marketplace</h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore and install verified agent bundles, domain skills, and pre-wired tool pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {marketplaceAgents.map((agent) => (
          <div key={agent.id} className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-5 space-y-3 text-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{agent.name}</span>
                <span className="flex items-center space-x-1 text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{agent.rating}</span>
                </span>
              </div>
              <span className="text-[11px] text-cyan-400 font-medium">By {agent.author}</span>
              <p className="text-slate-400 leading-relaxed">{agent.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-500 font-mono text-[11px]">{agent.downloads} installs</span>
              <button
                onClick={() => alert(`${agent.name} bundle configuration is ready.`)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  agent.installed 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {agent.installed ? 'Installed' : 'Install Bundle'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
