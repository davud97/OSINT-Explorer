import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import RiskBadge from "../components/atoms/RiskBadge";
import { History, Trash2, Search } from "lucide-react";
import { loadHistory, removeHistory, clearHistory } from "../lib/storage";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setItems(loadHistory());
  }, []);

  const filtered = items.filter((i) =>
    i.query.toLowerCase().includes(filter.toLowerCase())
  );

  const remove = (id) => {
    removeHistory(id);
    setItems(loadHistory());
  };

  const wipe = () => {
    clearHistory();
    setItems([]);
  };

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 mb-2">
              Workspace · Audit Trail
            </div>
            <h1 className="font-heading font-semibold text-3xl text-white tracking-tight">
              Investigation History
            </h1>
            <p className="text-slate-400 font-body text-sm mt-1">
              Recent OSINT investigations, kept locally on this device.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.75} />
              <input
                data-testid="history-filter"
                placeholder="Filter by query…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-[#050B14] border border-slate-800 rounded-md pl-9 pr-3 py-2 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/40 focus:outline-none"
              />
            </div>
            <button
              data-testid="clear-history-btn"
              onClick={wipe}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              Clear All
            </button>
          </div>
        </div>

        <div className="cyber-card overflow-hidden">
          <div className="card-strip" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#070E1A] border-b border-slate-800">
                <tr>
                  <Th>Query</Th>
                  <Th>Type</Th>
                  <Th>Risk</Th>
                  <Th>Sources</Th>
                  <Th>Timestamp</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <History className="w-8 h-8 text-slate-700 mx-auto mb-3" strokeWidth={1.5} />
                      <div className="font-body text-slate-400 text-sm">
                        No investigations yet. Run your first search to populate history.
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    data-testid={`history-row-${entry.id}`}
                    className="border-t border-slate-800/60 hover:bg-slate-800/20 transition-colors"
                  >
                    <Td>
                      <Link
                        to={`/results?q=${encodeURIComponent(entry.query)}&type=${entry.queryType}&t=${Date.now()}`}
                        className="font-mono text-cyan-200 hover:text-cyan-100 hover:underline"
                      >
                        {entry.query}
                      </Link>
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300 px-2 py-0.5 rounded border border-slate-800 bg-slate-900/40">
                        {entry.queryType}
                      </span>
                    </Td>
                    <Td>
                      <RiskBadge level={entry.risk.level} score={entry.risk.score} size="sm" />
                    </Td>
                    <Td className="font-mono text-slate-300">
                      {entry.summary.sourcesWithResults}
                      <span className="text-slate-600">/</span>
                      {entry.summary.sourcesQueried}
                    </Td>
                    <Td className="font-mono text-slate-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Td>
                    <Td>
                      <button
                        data-testid={`history-delete-${entry.id}`}
                        onClick={() => remove(entry.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const Th = ({ children }) => (
  <th className="text-left font-mono text-[10px] uppercase tracking-widest text-slate-500 px-4 py-3">
    {children}
  </th>
);
const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3.5 text-[13px] text-slate-200 font-body ${className}`}>{children}</td>
);
