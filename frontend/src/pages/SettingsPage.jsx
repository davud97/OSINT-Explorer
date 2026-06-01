import React, { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { MODULE_CATALOG } from "../data/mockResults";
import { loadSettings, saveSettings } from "../lib/storage";
import { Settings as SettingsIcon, Check } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const toggleModule = (id) => {
    const next = {
      ...settings,
      enabledModules: {
        ...settings.enabledModules,
        [id]: !settings.enabledModules?.[id],
      },
    };
    setSettings(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const update = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 mb-2">
              Configuration
            </div>
            <h1 className="font-heading font-semibold text-3xl text-white tracking-tight">
              Settings
            </h1>
            <p className="text-slate-400 font-body text-sm mt-1">
              Investigation profile, source toggles, and operator preferences.
            </p>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] text-emerald-300 border border-emerald-500/30 bg-emerald-500/10">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        {/* Operator profile */}
        <div className="cyber-card p-6">
          <div className="card-strip -mx-6 -mt-6 mb-5" />
          <h3 className="font-heading text-base font-medium text-white tracking-tight mb-4">
            Operator Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Operator Identifier
              </label>
              <input
                data-testid="settings-operator"
                value={settings.operator || ""}
                onChange={(e) => update("operator", e.target.value)}
                className="mt-2 w-full bg-[#050B14] border border-slate-800 rounded-md px-3 py-2 text-sm font-mono text-slate-100 focus:border-cyan-500/40 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="relative">
                  <input
                    type="checkbox"
                    data-testid="settings-autosave"
                    checked={!!settings.autoSaveReports}
                    onChange={(e) => update("autoSaveReports", e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="block w-10 h-5 rounded-full bg-slate-800 peer-checked:bg-cyan-400/30 border border-slate-700 peer-checked:border-cyan-400/50 transition-colors" />
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-400 peer-checked:bg-cyan-300 peer-checked:translate-x-5 transition-transform" />
                </span>
                <span className="font-body text-sm text-slate-200">
                  Auto-save investigations to Reports
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Module toggles */}
        <div className="cyber-card p-6">
          <div className="card-strip -mx-6 -mt-6 mb-5" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base font-medium text-white tracking-tight">
              Enabled OSINT Modules
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {Object.values(settings.enabledModules || {}).filter(Boolean).length} /{" "}
              {MODULE_CATALOG.length} active
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODULE_CATALOG.map((m) => {
              const enabled = settings.enabledModules?.[m.id];
              return (
                <button
                  key={m.id}
                  data-testid={`settings-module-${m.id}`}
                  onClick={() => toggleModule(m.id)}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left transition-all ${
                    enabled
                      ? "border-cyan-400/30 bg-cyan-400/5"
                      : "border-slate-800 bg-slate-900/30 opacity-70"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-body text-[13px] text-white">{m.name}</div>
                    <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                      {m.category}
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      enabled
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-800/40 text-slate-500"
                    }`}
                  >
                    {enabled ? "ON" : "OFF"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* About */}
        <div className="cyber-card p-6 flex items-start gap-4">
          <SettingsIcon className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={1.75} />
          <div>
            <div className="font-heading text-[14px] font-medium text-white">About</div>
            <div className="text-[12.5px] text-slate-400 font-body leading-relaxed mt-1">
              OSINT Explorer is a centralized cyber investigation platform that gathers
              public intelligence from multiple OSINT sources. It helps identify exposed
              domains, IPs, emails, usernames, subdomains, open ports, WHOIS data, and
              reputation findings through one unified dashboard.
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
