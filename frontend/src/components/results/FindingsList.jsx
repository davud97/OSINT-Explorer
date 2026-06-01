import React from "react";
import { AlertTriangle, Info, ShieldAlert, CircleAlert, Sparkles } from "lucide-react";

const SEVERITY = {
  critical: { color: "text-red-400", bar: "bg-red-500", icon: ShieldAlert, label: "CRIT" },
  high: { color: "text-amber-400", bar: "bg-amber-500", icon: AlertTriangle, label: "HIGH" },
  medium: { color: "text-blue-400", bar: "bg-blue-500", icon: CircleAlert, label: "MED" },
  low: { color: "text-emerald-400", bar: "bg-emerald-500", icon: Info, label: "LOW" },
  info: { color: "text-slate-400", bar: "bg-slate-500", icon: Info, label: "INFO" },
};

export default function FindingsList({ findings = [] }) {
  return (
    <div data-testid="findings-card" className="cyber-card">
      <div className="card-strip" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300" strokeWidth={1.75} />
            <h3 className="font-heading text-base font-medium text-white tracking-tight">
              Key Findings
            </h3>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            {findings.length} insights
          </span>
        </div>
        <ul className="space-y-2">
          {findings.map((f, idx) => {
            const meta = SEVERITY[f.severity] || SEVERITY.info;
            const Icon = meta.icon;
            return (
              <li
                key={idx}
                data-testid={`finding-${idx}`}
                className="group flex items-start gap-3 px-3 py-3 rounded-md border border-slate-800/70 bg-[#070E1A] hover:border-slate-700 transition-colors"
              >
                <div className={`relative shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${meta.color}`} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-200 font-body leading-relaxed">
                    {f.text}
                  </p>
                </div>
                <span className={`font-mono text-[10px] tracking-wider ${meta.color} px-2 py-0.5 rounded border border-slate-800 bg-slate-900/60`}>
                  {meta.label}
                </span>
              </li>
            );
          })}
          {findings.length === 0 && (
            <li className="text-sm text-slate-500 font-body italic">
              No findings reported.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
