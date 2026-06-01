import React from "react";
import { NavLink } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Database,
  History as HistoryIcon,
  FileText,
  Settings as SettingsIcon,
  Radar,
} from "lucide-react";

const NAV = [
  { to: "/", label: "New Search", icon: Search, end: true },
  { to: "/results", label: "Results Dashboard", icon: LayoutDashboard },
  { to: "/sources", label: "Sources", icon: Database },
  { to: "/history", label: "History", icon: HistoryIcon },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside
      data-testid="app-sidebar"
      className="h-screen w-64 shrink-0 border-r border-slate-800/80 bg-[#070E1A] flex flex-col"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-cyan-400/20 to-blue-500/10 border border-cyan-400/30 flex items-center justify-center glow-cyan">
            <Radar className="w-5 h-5 text-cyan-300" strokeWidth={1.75} />
          </div>
        </div>

        <div className="leading-tight">
          <div className="font-heading font-semibold text-[15px] tracking-tight text-white">
            OSINT <span className="text-cyan-300">Explorer</span>
          </div>
          <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
            v1.0 · Intel Suite
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Workspace
        </div>

        {NAV.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 border ${
                  isActive
                    ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-100"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40 hover:border-slate-800"
                }`
              }
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              <span className="font-body">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom text removed */}
      <div className="px-4 py-4 border-t border-slate-800/80"></div>
    </aside>
  );
}
