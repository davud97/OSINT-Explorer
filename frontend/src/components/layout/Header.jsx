import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ChevronDown, Activity } from "lucide-react";
import { detectQueryType } from "../../data/mockResults";

const TYPES = [
  { value: "auto", label: "Auto-detect" },
  { value: "email", label: "Email" },
  { value: "domain", label: "Domain" },
  { value: "ip", label: "IP Address" },
  { value: "username", label: "Username" },
];

export default function Header({ onSubmit }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState("auto");
  const [open, setOpen] = useState(false);

  const submit = (e) => {
    e?.preventDefault();
    if (!q.trim()) return;
    const finalType = type === "auto" ? detectQueryType(q) : type;
    if (onSubmit) onSubmit(q.trim(), finalType);
    else navigate(`/results?q=${encodeURIComponent(q.trim())}&type=${finalType}`);
  };

  return (
    <header
      data-testid="app-header"
      className="h-16 shrink-0 border-b border-slate-800/80 bg-[#070E1A]/80 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-30"
    >
      <form onSubmit={submit} className="flex items-center flex-1 max-w-3xl gap-2">
        <div className="relative flex-1 group">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-300 transition-colors"
            strokeWidth={1.75}
          />
          <input
            data-testid="header-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search indicator — email, domain, IP, or username"
            className="w-full bg-[#050B14] border border-slate-800 rounded-md pl-10 pr-4 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>

        {/* Type selector */}
        <div className="relative">
          <button
            type="button"
            data-testid="header-type-selector"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 bg-[#050B14] border border-slate-800 rounded-md px-3 py-2.5 text-sm text-slate-300 hover:border-slate-700 hover:text-white transition-all min-w-[150px]"
          >
            <span className="font-body">
              {TYPES.find((t) => t.value === type)?.label}
            </span>
            <ChevronDown className="w-4 h-4 ml-auto text-slate-500" strokeWidth={1.75} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-[#0B1320] border border-slate-800 shadow-xl z-50 overflow-hidden">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  data-testid={`type-option-${t.value}`}
                  onClick={() => {
                    setType(t.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    type === t.value
                      ? "bg-cyan-400/10 text-cyan-200"
                      : "text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          data-testid="header-search-submit"
          className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-medium text-sm px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 shadow-[0_0_24px_rgba(0,229,255,0.25)]"
        >
          <SearchIcon className="w-4 h-4" strokeWidth={2} />
          Run Scan
        </button>
      </form>

      <div className="flex items-center gap-3 ml-auto">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-800 bg-[#050B14]">
          <Activity className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
          <span className="font-mono text-[11px] text-slate-400">
            <span className="text-emerald-400">●</span> 12 sources online
          </span>
        </div>
        <div className="hidden md:flex flex-col items-end leading-tight">
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
            Design and Developed by
          </span>
          <span className="font-body text-[12px] text-slate-200">Dawood Ilyas</span>
        </div>
      </div>
    </header>
  );
}
