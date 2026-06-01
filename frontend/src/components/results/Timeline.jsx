import React from "react";
import { Clock } from "lucide-react";

const SEV_COLOR = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#10b981",
  info: "#64748b",
};

export default function Timeline({ events = [] }) {
  const sorted = [...events].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  return (
    <div data-testid="timeline-card" className="cyber-card">
      <div className="card-strip" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-300" strokeWidth={1.75} />
            <h3 className="font-heading text-base font-medium text-white tracking-tight">
              Activity Timeline
            </h3>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            {sorted.length} events
          </span>
        </div>

        <div className="relative pl-6">
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-800" />
          <ol className="space-y-5">
            {sorted.map((e, idx) => {
              const c = SEV_COLOR[e.severity] || SEV_COLOR.info;
              return (
                <li key={idx} className="relative" data-testid={`timeline-event-${idx}`}>
                  <span
                    className="absolute -left-[22px] top-1 inline-flex w-3.5 h-3.5 rounded-full ring-4 ring-[#0B1320]"
                    style={{ background: c, boxShadow: `0 0 10px ${c}` }}
                  />
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-body text-[13px] text-slate-100">
                        {e.title}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                        {new Date(e.ts).toISOString().replace("T", " ").slice(0, 19)} UTC
                        <span className="text-slate-700 mx-2">·</span>
                        <span className="text-slate-400">{e.source}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
            {sorted.length === 0 && (
              <li className="text-sm text-slate-500 font-body italic">
                No events recorded.
              </li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
