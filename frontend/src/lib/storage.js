// localStorage-backed history utilities
const HISTORY_KEY = "osint_explorer_history_v1";
const REPORTS_KEY = "osint_explorer_reports_v1";
const SETTINGS_KEY = "osint_explorer_settings_v1";

export const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveHistory = (entries) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
};

export const addHistory = (result) => {
  const entries = loadHistory();
  // de-dupe by id
  const filtered = entries.filter((e) => e.id !== result.id);
  filtered.unshift({
    id: result.id,
    query: result.query,
    queryType: result.queryType,
    timestamp: result.timestamp,
    risk: result.risk,
    summary: result.summary,
    full: result,
  });
  saveHistory(filtered.slice(0, 50));
};

export const removeHistory = (id) => {
  saveHistory(loadHistory().filter((e) => e.id !== id));
};

export const clearHistory = () => saveHistory([]);

export const loadReports = () => {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveReport = (result) => {
  const all = loadReports();
  const filtered = all.filter((r) => r.id !== result.id);
  filtered.unshift({
    id: result.id,
    name: `${result.query} (${result.queryType})`,
    savedAt: new Date().toISOString(),
    full: result,
  });
  localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
};

export const removeReport = (id) =>
  localStorage.setItem(
    REPORTS_KEY,
    JSON.stringify(loadReports().filter((r) => r.id !== id))
  );

export const loadSettings = () => {
  try {
    return JSON.parse(
      localStorage.getItem(SETTINGS_KEY) ||
        JSON.stringify({
          autoSaveReports: false,
          theme: "dark",
          operator: "Dawood Ilyas",
          enabledModules: {
            github: true,
            whois: true,
            virustotal: true,
            shodan: true,
            otx: true,
            harvester: true,
            subfinder: true,
            httpx: true,
            maigret: true,
            ghunt: true,
            holehe: true,
            userscanner: true,
          },
        })
    );
  } catch {
    return {};
  }
};

export const saveSettings = (s) =>
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
