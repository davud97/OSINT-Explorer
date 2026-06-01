import React from "react";
import RiskBadge from "../atoms/RiskBadge";
import { Hash, Calendar, Database, CheckCircle2, AlertOctagon } from "lucide-react";

const TYPE_LABEL = {
  email: "Email",
  domain: "Domain",
  ip: "IP Address",
  username: "Username",
};

export default function SummaryCard({ result }) {
  const { query, queryType, timestamp, risk, summary } = result;
  const ts = new Date(timestamp);
  return (
    <div
      data-testid="summary-card"
      className="cyber-card relative overflow-hidden"
    >
      <div className="card-strip" />
      <div className="p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Investigation Target · {TYPE_LABEL[queryType]}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Hash className="w-5 h-5 text-cyan-300" strokeWidth={1.75} />
              <span
                data-testid="summary-query"
                className="font-mono text-2xl text-white tracking-tight break-all"
              >
                {query}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-slate-400 font-body">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="font-mono text-slate-300">
                  {ts.toLocaleString()}
                </span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-[11px] text-slate-500">
                ID: {result.id}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Risk Level
            </span>
            <RiskBadge level={risk.level} score={risk.score} size="lg" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/60 mt-6 rounded-md overflow-hidden border border-slate-800">
          <Stat
            icon={Database}
            label="Sources Queried"
            value={summary.sourcesQueried}
            color="text-cyan-300"
          />
          <Stat
            icon={CheckCircle2}
            label="With Results"
            value={summary.sourcesWithResults}
            color="text-emerald-300"
          />
          <Stat
            icon={AlertOctagon}
            label="Errors"
            value={summary.errors}
            color={summary.errors > 0 ? "text-red-300" : "text-slate-400"}
          />
          <Stat
            icon={Hash}
            label="No Results"
            value={summary.noResults}
            color="text-slate-300"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#0B1320] px-5 py-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center">
        <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.75} />
      </div>
      <div className="leading-tight">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {label}
        </div>
        <div className={`font-heading text-xl tabular ${color}`}>{value}</div>
      </div>
    </div>
  );
}
