import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Mail, Globe, Server, User, Shield, Zap, Activity, ArrowRight } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { detectQueryType } from "../data/mockResults";

const EXAMPLES = [
  { value: "email@example.com", type: "email", icon: Mail, label: "Email" },
  { value: "example.com", type: "domain", icon: Globe, label: "Domain" },
  { value: "8.8.8.8", type: "ip", icon: Server, label: "IP" },
  { value: "johndoe", type: "username", icon: User, label: "Username" },
];

const FEATURES = [
  { icon: Shield, title: "12 OSINT Sources", desc: "Aggregated intelligence in seconds" },
  { icon: Zap, title: "Real-time Scanning", desc: "Progressive evidence delivery" },
  { icon: Activity, title: "Risk Scoring", desc: "Composite indicator analysis" },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState("auto");

  const submit = (queryStr, typeOverride) => {
    const finalQ = (queryStr || q).trim();
    if (!finalQ) return;
    const finalType =
      typeOverride && typeOverride !== "auto"
        ? typeOverride
        : type !== "auto"
          ? type
          : detectQueryType(finalQ);
    navigate(`/results?q=${encodeURIComponent(finalQ)}&type=${finalType}`);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Hero label */}
        <div className="flex items-center gap-2 mb-8">
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-60" />
            <span className="absolute inset-0 rounded-full bg-cyan-400" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
            Investigation Console · Live
          </span>
        </div>

        <h1 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.05]">
          Start an{" "}
          <span className="text-cyan-300 text-cyan-glow">OSINT</span>
          <br />
          Investigation
        </h1>
        <p className="text-slate-400 font-body text-base mt-5 max-w-xl leading-relaxed">
          Aggregate signals from 12 open-source intelligence modules into a
          single, audit-ready evidence stream. Built for IT advisory, cyber
          investigation, compliance, and digital forensics.
        </p>

        {/* Search input */}
        <form
          data-testid="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-10 cyber-card p-2 flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-300 transition-colors"
              strokeWidth={1.75}
            />
            <input
              data-testid="search-input"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Enter email, domain, IP address, or username"
              className="w-full bg-transparent pl-12 pr-4 py-4 text-base font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          <select
            data-testid="search-type-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-[#050B14] border border-slate-800 rounded-md px-3 py-3 text-sm text-slate-300 hover:border-slate-700 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all"
          >
            <option value="auto">Auto-detect</option>
            <option value="email">Email</option>
            <option value="domain">Domain</option>
            <option value="ip">IP Address</option>
            <option value="username">Username</option>
          </select>

          <button
            type="submit"
            data-testid="search-submit"
            className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-medium text-sm px-6 py-3 rounded-md transition-all duration-200 flex items-center gap-2 shadow-[0_0_24px_rgba(0,229,255,0.2)] justify-center"
          >
            Run Investigation
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </form>

        <p className="text-[12px] font-body text-slate-500 mt-3">
          Supports: email addresses, domain names, IPv4 addresses, and online
          usernames. Auto-detect identifies the indicator type automatically.
        </p>

        {/* Example chips */}
        <div className="mt-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">
            Try an example
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => {
              const Icon = ex.icon;
              return (
                <button
                  key={ex.value}
                  data-testid={`example-chip-${ex.type}`}
                  onClick={() => {
                    setQ(ex.value);
                    setType(ex.type);
                    submit(ex.value, ex.type);
                  }}
                  className="group flex items-center gap-2 px-3.5 py-2 rounded-md border border-slate-800 bg-[#070E1A] hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" strokeWidth={1.75} />
                  <span className="font-mono text-[12.5px] text-slate-300 group-hover:text-cyan-100">
                    {ex.value}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 group-hover:text-cyan-400/60">
                    · {ex.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-12">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="cyber-card p-5 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-md border border-cyan-400/20 bg-cyan-400/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-cyan-300" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-heading text-[14px] font-medium text-white">
                    {f.title}
                  </div>
                  <div className="text-[12px] text-slate-400 font-body mt-0.5">
                    {f.desc}
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
