import React, { useState } from "react";
import { ChevronDown, ExternalLink, Github, Globe, ShieldAlert, Server, Wheat, Satellite, GitBranch, Activity, Scan, MailSearch, SearchCheck, Radar } from "lucide-react";
import StatusBadge from "../atoms/StatusBadge";
import {
  GithubModule,
  WhoisModule,
  VirusTotalModule,
  ShodanModule,
  HarvesterModule,
  HoleheModule,
  GhuntModule,
  MaigretModule,
  OtxModule,
  SubfinderModule,
  HttpxModule,
  UserScannerModule,
  GenericInfoModule,
} from "./moduleRenderers";

const ICONS = {
  github: Github,
  globe: Globe,
  "shield-alert": ShieldAlert,
  server: Server,
  wheat: Wheat,
  satellite: Satellite,
  "git-branch": GitBranch,
  activity: Activity,
  scan: Scan,
  "mail-search": MailSearch,
  "search-check": SearchCheck,
  radar: Radar,
};

const RENDERERS = {
  github: GithubModule,
  whois: WhoisModule,
  virustotal: VirusTotalModule,
  shodan: ShodanModule,
  harvester: HarvesterModule,
  holehe: HoleheModule,
  ghunt: GhuntModule,
  maigret: MaigretModule,
  otx: OtxModule,
  subfinder: SubfinderModule,
  httpx: HttpxModule,
  userscanner: UserScannerModule,
};

export default function ModuleCard({ module, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = ICONS[module.icon] || Server;
  const Renderer = RENDERERS[module.id] || GenericInfoModule;

  const isInactive =
    module.status === "no_results" || module.status === "not_applicable";
  const isError = module.status === "error";

  return (
    <div
      data-testid={`module-card-${module.id}`}
      className="cyber-card overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid={`module-toggle-${module.id}`}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-slate-800/20 transition-colors"
      >
        <div
          className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${
            isError
              ? "bg-red-500/5 border-red-500/20"
              : isInactive
                ? "bg-slate-800/30 border-slate-800"
                : "bg-cyan-400/5 border-cyan-400/20"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              isError
                ? "text-red-400"
                : isInactive
                  ? "text-slate-500"
                  : "text-cyan-300"
            }`}
            strokeWidth={1.75}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-heading text-[15px] font-medium text-white tracking-tight">
              {module.name}
            </h4>
            <StatusBadge status={module.status} />
          </div>
          <p className="text-[12.5px] text-slate-400 font-body mt-1 leading-relaxed">
            {module.summary}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 mt-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div className="border-t border-slate-800/80 px-5 py-5 bg-[#070E1A]/60 reveal">
          <Renderer module={module} />
        </div>
      )}
    </div>
  );
}

export function SafeLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 hover:underline font-mono"
    >
      {children}
      <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
    </a>
  );
}
