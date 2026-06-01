import React from "react";
import { ShieldAlert } from "lucide-react";

export default function Footer() {
  return (
    <footer
      data-testid="app-footer"
      className="border-t border-slate-800/80 bg-[#070E1A]/60 px-8 py-5 mt-12"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldAlert
            className="w-4 h-4 text-amber-400 mt-0.5 shrink-0"
            strokeWidth={1.75}
          />
          <p className="text-[12px] font-body text-slate-400 leading-relaxed max-w-2xl">
            Use this platform only for authorized security research,
            compliance, and investigation purposes. Unauthorized intelligence
            collection may violate applicable laws.
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
          OSINT Explorer · Build 1.0
        </div>
      </div>
    </footer>
  );
}
