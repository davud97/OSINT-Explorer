import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import SummaryCard from "../components/results/SummaryCard";
import FindingsList from "../components/results/FindingsList";
import Timeline from "../components/results/Timeline";
import EvidenceExport from "../components/results/EvidenceExport";
import ModuleCard from "../components/results/ModuleCard";
import ScanProgress from "../components/results/ScanProgress";
// Real Flask API will be used instead of mock results
import { addHistory, saveReport } from "../lib/storage";
import { ArrowLeft, BookmarkPlus, RotateCcw } from "lucide-react";

const SCAN_STEPS = [
  "Resolving indicator…",
  "Checking GitHub Intelligence…",
  "Checking WHOIS records…",
  "Querying VirusTotal…",
  "Probing Shodan banners…",
  "Aggregating breach/account sources…",
  "Pulling AlienVault OTX pulses…",
  "Compiling timeline & risk score…",
];

export default function ResultsPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = params.get("q") || "";
  const type = params.get("type") || "username";

  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [revealedModules, setRevealedModules] = useState(0);
  const [savedToReports, setSavedToReports] = useState(false);

  // Real Flask API scan
useEffect(() => {
  if (!query) return;

  setStepIdx(0);
  setResult(null);
  setRevealedModules(0);
  setSavedToReports(false);

  let cancelled = false;

  const progressTimer = setInterval(() => {
    setStepIdx((prev) => {
      if (prev >= SCAN_STEPS.length - 1) return prev;
      return prev + 1;
    });
  }, 500);

  const moduleNames = {
    github: "GitHub Intelligence",
    whois: "WHOIS",
    virustotal: "VirusTotal",
    shodan: "Shodan",
    otx: "AlienVault OTX",
    theharvester: "theHarvester",
    censys: "Censys",
    subfinder: "Subfinder",
    maigret: "Maigret Username Scan",
    holehe: "Holehe Email Lookup",
    ghunt: "GHunt Google Account Intelligence",
    userscanner: "UserScanner",
  };

  const moduleIcons = {
    github: "github",
    whois: "globe",
    virustotal: "shield-alert",
    shodan: "server",
    otx: "satellite",
    theharvester: "wheat",
    censys: "server",
    subfinder: "git-branch",
    maigret: "scan",
    holehe: "mail-search",
    ghunt: "search-check",
    userscanner: "radar",
  };

  const toReactResult = (apiData) => {
    const modulesObject = apiData.modules || {};

    const modules = Object.entries(modulesObject).map(([key, value]) => {
      const data = value?.data || {};

      let mappedData = data;

      if (key === "github") {
        mappedData = {
          username: data.user?.login,
          name: data.user?.name,
          company: data.user?.company,
          location: data.user?.location,
          profile_url: data.user?.profile_url,
          public_repos: data.user?.public_repos,
          followers: data.user?.followers,
          following: data.user?.following,
          repositories: (data.repositories || []).map((repo) => ({
            name: repo.name,
            lang: repo.language,
            stars: repo.stars,
            updated: repo.updated_at || "N/A",
          })),
        };
      }

      if (key === "whois") {
        mappedData = {
          registrar: data.registrar,
          organization: data.org,
          country: data.country,
          creation_date: data.creation_date,
          expiration_date: data.expiration_date,
          updated_date: data.updated_date,
          name_servers: data.name_servers,
          status: data.status_list,
        };
      }

      if (key === "virustotal") {
        mappedData = {
          reputation: data.reputation,
          stats: data.last_analysis_stats,
          categories: data.categories,
        };
      }

      if (key === "shodan") {
        mappedData = {
          host: data.host,
          organization: data.organization,
          ports: data.open_ports,
          services: (data.services || []).map((service) => ({
            port: service.port,
            service: service.service,
            banner: service.product,
          })),
        };
      }

      if (key === "theharvester") {
        mappedData = {
          hosts: data.hosts,
          emails: data.emails,
          ips: data.ips,
          urls: data.urls,
        };
      }

      if (key === "holehe") {
  const checkedMatch = (data.raw_output || "").match(/(\d+)\s+websites checked/i);

  mappedData = {
    checked_count: checkedMatch ? checkedMatch[1] : null,
    platforms: (data.found_on || []).map((platform) => ({
      name: platform,
      found: true,
      link: null,
    })),
    raw_output: data.raw_output,
  };
}

      if (key === "ghunt") {
  mappedData = {
    email: data.email,
    google_id: data.gaia_id,
    profile_image: data.profile_picture,
    last_active: data.last_profile_edit,
    services: data.activated_services || [],
    maps_profile: data.maps_profile,
    calendar: data.calendar,
    reviews: data.reviews,
    ratings: data.ratings,
    photos: data.photos,
    videos: data.videos,
    answers: data.answers,
    edits: data.edits,
  };
}

      if (key === "maigret") {
        mappedData = {
          accounts: (data.accounts || []).map((account) => ({
            site: account.site,
            url: account.url,
            category: account.category || (account.tags || []).join(", "),
            status: account.status,
          })),
        };
      }

      if (key === "otx") {
        mappedData = {
          passive_dns_count: data.related?.passive_dns_count,
          pulses: data.pulses || [],
        };
      }

      if (key === "userscanner") {
        mappedData = {
          platforms_checked: data.total_hits,
          accounts_found: data.total_hits,
          likely_handles: (data.found_on || []).map((entry) => entry.site || entry),
        };
      }

      return {
        id: key === "theharvester" ? "harvester" : key,
        name: moduleNames[key] || key,
        icon: moduleIcons[key] || "server",
        status: value?.status || "no_results",
        summary: value?.error || `${moduleNames[key] || key} status: ${value?.status || "unknown"}`,
        risk_contribution: 0,
        data: mappedData,
      };
    });

    const riskLevel = (apiData.summary?.risk_level || "low").toLowerCase();
    const riskScore =
      riskLevel === "high" ? 75 :
      riskLevel === "medium" ? 45 :
      15;

    return {
      id: `inv_${Date.now()}`,
      query: apiData.query,
      queryType: apiData.query_type,
      timestamp: apiData.timestamp,
      risk: {
        score: riskScore,
        level: riskLevel,
      },
      summary: {
        sourcesQueried: apiData.summary?.sources_queried || modules.length,
        sourcesWithResults: apiData.summary?.sources_with_results || 0,
        errors: modules.filter((m) => m.status === "error").length,
        noResults: modules.filter((m) => m.status === "no_results").length,
      },
      findings: (apiData.summary?.key_findings || []).map((finding) => ({
        severity: "info",
        text: finding,
      })),
      modules,
      timeline: [],
      raw: apiData,
    };
  };

  fetch(
    `http://127.0.0.1:5000/api/results?query=${encodeURIComponent(query)}&query_type=${encodeURIComponent(type)}`
  )
    .then((res) => {
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    })
    .then((apiData) => {
      if (cancelled) return;
      clearInterval(progressTimer);
      setStepIdx(SCAN_STEPS.length);
      const realResult = toReactResult(apiData);
      setResult(realResult);
      addHistory(realResult);
    })
    .catch((err) => {
      if (cancelled) return;
      clearInterval(progressTimer);
      setResult({
        id: `error_${Date.now()}`,
        query,
        queryType: type,
        timestamp: new Date().toISOString(),
        risk: { score: 0, level: "low" },
        summary: {
          sourcesQueried: 0,
          sourcesWithResults: 0,
          errors: 1,
          noResults: 0,
        },
        findings: [
          {
            severity: "high",
            text: `Could not connect to Flask API: ${err.message}`,
          },
        ],
        modules: [],
        timeline: [],
      });
    });

  return () => {
    cancelled = true;
    clearInterval(progressTimer);
  };
}, [location.search]);

  // Stagger module reveal once result is ready
  useEffect(() => {
    if (!result) return;
    const total = result.modules.length;
    const interval = setInterval(() => {
      setRevealedModules((n) => {
        if (n >= total) {
          clearInterval(interval);
          return n;
        }
        return n + 1;
      });
    }, 140);
    return () => clearInterval(interval);
  }, [result]);

  if (!query) {
    return (
      <AppLayout>
        <div className="px-8 py-16 max-w-4xl mx-auto">
          <div className="cyber-card p-8 text-center">
            <h2 className="font-heading text-xl text-white mb-2">No active investigation</h2>
            <p className="text-slate-400 font-body text-sm mb-6">
              Start a new search to populate the results dashboard.
            </p>
            <button
              data-testid="goto-search-btn"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-medium text-sm px-5 py-2.5 rounded-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-7xl mx-auto space-y-6">
        {/* Crumb actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              data-testid="back-btn"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-body"
            >
              <ArrowLeft className="w-4 h-4" />
              New investigation
            </button>
            <span className="text-slate-700">/</span>
            <span className="font-mono text-[12px] text-slate-400">
              {type} · <span className="text-slate-100">{query}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="rerun-btn"
              onClick={() => navigate(`/results?q=${encodeURIComponent(query)}&type=${type}&t=${Date.now()}`)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/60 text-slate-200 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              Re-run
            </button>
            <button
              data-testid="save-report-btn"
              disabled={!result}
              onClick={() => {
                if (!result) return;
                saveReport(result);
                setSavedToReports(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/15 text-cyan-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookmarkPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
              {savedToReports ? "Saved" : "Save to Reports"}
            </button>
          </div>
        </div>

        {/* Scan progress (during scan) */}
        {!result && <ScanProgress steps={SCAN_STEPS} currentIdx={stepIdx} />}

        {/* Results */}
        {result && (
          <>
            <SummaryCard result={result} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FindingsList findings={result.findings} />
              </div>
              <div>
                <EvidenceExport result={result} />
              </div>
            </div>

            {/* Module grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-base font-medium text-white tracking-tight">
                  Module Results
                </h3>
                <span className="font-mono text-[11px] text-slate-500">
                  {revealedModules} / {result.modules.length} loaded
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {result.modules.slice(0, revealedModules).map((m, i) => (
                  <div key={m.id} className="reveal" style={{ animationDelay: `${i * 60}ms` }}>
                    <ModuleCard module={m} defaultOpen={i < 1} />
                  </div>
                ))}
                {/* skeletons for remaining */}
                {Array.from({ length: Math.max(0, result.modules.length - revealedModules) }).map(
                  (_, i) => (
                    <div
                      key={`sk-${i}`}
                      className="cyber-card h-[120px] skeleton-sweep"
                    />
                  )
                )}
              </div>
            </div>

            <Timeline events={result.timeline} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
