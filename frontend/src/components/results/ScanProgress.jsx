import React from "react";

export default function ScanProgress({ steps = [], currentIdx = 0 }) {
  return (
    <div data-testid="scan-progress" className="cyber-card scanline-overlay">
      <div className="card-strip" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative w-2.5 h-2.5">
              <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-60" />
              <span className="absolute inset-0 rounded-full bg-cyan-400" />
            </div>
            <h3 className="font-heading text-base font-medium text-white tracking-tight">
              Scan in progress
            </h3>
          </div>
          <span className="font-mono text-[11px] text-cyan-300">
            {currentIdx} / {steps.length}
          </span>
        </div>

        <div className="space-y-2">
          {steps.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md border transition-all ${
                  active
                    ? "border-cyan-400/40 bg-cyan-400/5"
                    : done
                      ? "border-slate-800 bg-slate-900/40"
                      : "border-slate-800/40 bg-transparent opacity-60"
                }`}
              >
                <div className="relative w-2 h-2 rounded-full">
                  {active ? (
                    <>
                      <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-70" />
                      <span className="absolute inset-0 rounded-full bg-cyan-400" />
                    </>
                  ) : done ? (
                    <span className="absolute inset-0 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #10b981" }} />
                  ) : (
                    <span className="absolute inset-0 rounded-full bg-slate-700" />
                  )}
                </div>
                <span
                  className={`font-mono text-[12.5px] ${
                    active ? "text-cyan-200" : done ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {s}
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-widest">
                  {done ? (
                    <span className="text-emerald-400">DONE</span>
                  ) : active ? (
                    <span className="text-cyan-300">RUNNING</span>
                  ) : (
                    <span className="text-slate-600">QUEUED</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Skeleton card preview row */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-md border border-slate-800 bg-slate-900/30 skeleton-sweep"
              style={{ opacity: 0.6 + (i % 2) * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
