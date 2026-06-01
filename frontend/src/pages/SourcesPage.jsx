import React from "react";
import AppLayout from "../components/layout/AppLayout";
import { MODULE_CATALOG } from "../data/mockResults";
import { Database, Github, Globe, ShieldAlert, Server, Wheat, Satellite, GitBranch, Activity, Scan, MailSearch, SearchCheck, Radar } from "lucide-react";

const ICON = {
  github: Github,
  whois: Globe,
  virustotal: ShieldAlert,
  shodan: Server,
  otx: Satellite,
  harvester: Wheat,
  subfinder: GitBranch,
  httpx: Activity,
  maigret: Scan,
  ghunt: SearchCheck,
  holehe: MailSearch,
  userscanner: Radar,
};

const CATEGORY_COLOR = {
  Identity: "border-cyan-500/30 bg-cyan-500/5 text-cyan-300",
  Infrastructure: "border-blue-500/30 bg-blue-500/5 text-blue-300",
  "Threat Intel": "border-amber-500/30 bg-amber-500/5 text-amber-300",
  Recon: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
};

export default function SourcesPage() {
  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 mb-2">
            Catalog
          </div>
          <h1 className="font-heading font-semibold text-3xl text-white tracking-tight">
            Intelligence Sources
          </h1>
          <p className="text-slate-400 font-body text-sm mt-1">
            {MODULE_CATALOG.length} integrated OSINT modules. Each is automatically routed
            based on the indicator type you submit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE_CATALOG.map((m) => {
            const Icon = ICON[m.id] || Database;
            return (
              <div
                key={m.id}
                data-testid={`source-card-${m.id}`}
                className="cyber-card p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-md border border-cyan-400/20 bg-cyan-400/5 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-cyan-300" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-[15px] font-medium text-white tracking-tight">
                      {m.name}
                    </h3>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider border ${
                        CATEGORY_COLOR[m.category] || ""
                      }`}
                    >
                      {m.category}
                    </span>
                  </div>
                </div>
                <p className="text-[13px] text-slate-400 font-body leading-relaxed">
                  {m.desc}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                    Supports
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.indicators.map((ind) => (
                      <span
                        key={ind}
                        className="font-mono text-[11px] px-2 py-0.5 rounded border border-slate-800 bg-slate-900/40 text-slate-300"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
