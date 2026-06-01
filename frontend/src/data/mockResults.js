// Mock OSINT results data for OSINT Explorer
// Returns a richly-structured response per indicator type.

const nowIso = () => new Date().toISOString();

const baseResponse = (query, queryType, modules) => {
  const sourcesQueried = modules.length;
  const sourcesWithResults = modules.filter((m) => m.status === "success").length;
  const errorCount = modules.filter((m) => m.status === "error").length;
  const noResults = modules.filter((m) => m.status === "no_results").length;

  // Compute risk
  const riskAccumulator = modules.reduce((acc, m) => acc + (m.risk_contribution || 0), 0);
  const riskScore = Math.min(100, Math.max(0, riskAccumulator));
  let riskLevel = "low";
  if (riskScore >= 75) riskLevel = "critical";
  else if (riskScore >= 50) riskLevel = "high";
  else if (riskScore >= 25) riskLevel = "medium";

  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    query,
    queryType,
    timestamp: nowIso(),
    risk: { score: riskScore, level: riskLevel },
    summary: {
      sourcesQueried,
      sourcesWithResults,
      errors: errorCount,
      noResults,
    },
    findings: [],
    modules,
    timeline: [],
  };
};

// ------- USERNAME -------
const usernameResponse = (q) => {
  const modules = [
    {
      id: "github",
      name: "GitHub Intelligence",
      icon: "github",
      status: "success",
      summary: "Active developer account discovered with 12 public repos",
      risk_contribution: 8,
      data: {
        username: q,
        profile_url: `https://github.com/${q}`,
        avatar: `https://avatars.githubusercontent.com/u/583231?v=4`,
        name: "Jane Doe",
        company: "@cyber-collective",
        location: "Berlin, DE",
        public_repos: 12,
        followers: 348,
        following: 71,
        created_at: "2018-04-22T10:14:00Z",
        bio: "Security researcher · Reverse engineer · OSS contributor",
        repositories: [
          { name: "recon-toolkit", lang: "Go", stars: 412, updated: "2025-09-12" },
          { name: "dns-walker", lang: "Python", stars: 198, updated: "2025-07-04" },
          { name: "wireshark-plugins", lang: "C", stars: 87, updated: "2024-11-30" },
          { name: "honeypot-orchestrator", lang: "Rust", stars: 64, updated: "2025-10-18" },
        ],
      },
    },
    {
      id: "maigret",
      name: "Maigret Username Scan",
      icon: "scan",
      status: "success",
      summary: "Confirmed presence on 7 platforms across 3 categories",
      risk_contribution: 14,
      data: {
        accounts: [
          { site: "GitHub", url: `https://github.com/${q}`, category: "Development", status: "claimed" },
          { site: "Twitter / X", url: `https://twitter.com/${q}`, category: "Social", status: "claimed" },
          { site: "Reddit", url: `https://reddit.com/user/${q}`, category: "Forum", status: "claimed" },
          { site: "Keybase", url: `https://keybase.io/${q}`, category: "Identity", status: "claimed" },
          { site: "HackerOne", url: `https://hackerone.com/${q}`, category: "Security", status: "claimed" },
          { site: "DEV.to", url: `https://dev.to/${q}`, category: "Development", status: "claimed" },
          { site: "Mastodon", url: `https://mastodon.social/@${q}`, category: "Social", status: "claimed" },
        ],
      },
    },
    {
      id: "holehe",
      name: "Holehe Email Lookup",
      icon: "mail-search",
      status: "not_applicable",
      summary: "Module bypassed for username queries",
      risk_contribution: 0,
      data: { reason: "Holehe operates on email indicators only." },
    },
    {
      id: "userscanner",
      name: "UserScanner Aggregator",
      icon: "radar",
      status: "success",
      summary: "Cross-platform handle correlation across 18 networks",
      risk_contribution: 6,
      data: {
        platforms_checked: 184,
        accounts_found: 18,
        likely_handles: [`@${q}`, `${q}_dev`, `${q}.io`],
      },
    },
    {
      id: "ghunt",
      name: "GHunt (Google)",
      icon: "search-check",
      status: "no_results",
      summary: "No public Google account linked to this handle",
      risk_contribution: 0,
      data: {},
    },
  ];
  const r = baseResponse(q, "username", modules);
  r.findings = [
    { severity: "high", text: `Confirmed identity on ${modules[1].data.accounts.length} third-party platforms.` },
    { severity: "medium", text: "Public GitHub activity reveals offensive security tooling expertise." },
    { severity: "info", text: "Account exists since April 2018 — long-standing online presence." },
    { severity: "low", text: "No exposed Google account information detected." },
  ];
  r.timeline = [
    { ts: "2018-04-22T10:14:00Z", title: "GitHub account created", source: "GitHub", severity: "info" },
    { ts: "2019-08-04T08:00:00Z", title: "Joined HackerOne", source: "Maigret", severity: "info" },
    { ts: "2022-02-15T13:21:00Z", title: "First public exploit repo published", source: "GitHub", severity: "medium" },
    { ts: "2024-06-10T11:42:00Z", title: "Mastodon account discovered", source: "Maigret", severity: "info" },
    { ts: "2025-10-18T16:00:00Z", title: "Last known commit activity", source: "GitHub", severity: "low" },
  ];
  return r;
};

// ------- EMAIL -------
const emailResponse = (q) => {
  const modules = [
    {
      id: "holehe",
      name: "Holehe Email Lookup",
      icon: "mail-search",
      status: "success",
      summary: "Email registered on 9 services — 2 leaked in known breaches",
      risk_contribution: 22,
      data: {
        platforms: [
          { name: "LinkedIn", found: true, link: "https://linkedin.com" },
          { name: "Twitter / X", found: true, link: "https://twitter.com" },
          { name: "Adobe", found: true, link: "https://adobe.com" },
          { name: "Pinterest", found: true, link: null },
          { name: "Spotify", found: true, link: null },
          { name: "Dropbox", found: true, link: null },
          { name: "Coinbase", found: false, link: null },
          { name: "Instagram", found: true, link: null },
          { name: "GitHub", found: true, link: null },
          { name: "Steam", found: false, link: null },
        ],
      },
    },
    {
      id: "ghunt",
      name: "GHunt (Google)",
      icon: "search-check",
      status: "success",
      summary: "Public Google account profile recovered",
      risk_contribution: 10,
      data: {
        google_id: "118277492341882910321",
        name: "J. Doe",
        profile_image: "https://lh3.googleusercontent.com/a/default-user=s256",
        last_active: "2025-12-03",
        services: ["Photos", "Maps Reviews", "YouTube"],
      },
    },
    {
      id: "harvester",
      name: "theHarvester",
      icon: "wheat",
      status: "success",
      summary: "Indirect discovery of 4 related hosts and 2 emails",
      risk_contribution: 6,
      data: {
        hosts: ["mail.example.com", "smtp.example.com", "vpn.example.com", "portal.example.com"],
        emails: [`admin@${q.split("@")[1] || "example.com"}`, `info@${q.split("@")[1] || "example.com"}`],
        ips: ["203.0.113.42", "203.0.113.78"],
        urls: [],
      },
    },
    {
      id: "github",
      name: "GitHub Intelligence",
      icon: "github",
      status: "no_results",
      summary: "No GitHub account directly linked to this email",
      risk_contribution: 0,
      data: {},
    },
    {
      id: "maigret",
      name: "Maigret Username Scan",
      icon: "scan",
      status: "not_applicable",
      summary: "Maigret requires a username — derived handle scan skipped",
      risk_contribution: 0,
      data: { reason: "Run a username investigation for handle correlation." },
    },
    {
      id: "virustotal",
      name: "VirusTotal",
      icon: "shield-alert",
      status: "error",
      summary: "API key missing — module skipped",
      risk_contribution: 0,
      data: { error: "VIRUSTOTAL_API_KEY not configured" },
    },
  ];
  const r = baseResponse(q, "email", modules);
  r.findings = [
    { severity: "critical", text: "Email exposed in 2 historical data breaches (Adobe 2013, Dropbox 2012)." },
    { severity: "high", text: "Public Google identity discovered including profile image and YouTube activity." },
    { severity: "medium", text: "Account registered on 9 consumer services — wide attack surface." },
    { severity: "info", text: "No directly linked GitHub account found." },
  ];
  r.timeline = [
    { ts: "2012-07-19T00:00:00Z", title: "Compromised in Dropbox breach", source: "HIBP", severity: "critical" },
    { ts: "2013-10-04T00:00:00Z", title: "Compromised in Adobe breach", source: "HIBP", severity: "critical" },
    { ts: "2018-11-21T00:00:00Z", title: "LinkedIn account confirmed", source: "Holehe", severity: "info" },
    { ts: "2022-05-07T00:00:00Z", title: "Active Spotify session detected", source: "Holehe", severity: "low" },
    { ts: "2025-12-03T00:00:00Z", title: "Last Google service activity", source: "GHunt", severity: "info" },
  ];
  return r;
};

// ------- DOMAIN -------
const domainResponse = (q) => {
  const modules = [
    {
      id: "whois",
      name: "WHOIS",
      icon: "globe",
      status: "success",
      summary: "Domain registered 2014 · Registrar: NameCheap, Inc.",
      risk_contribution: 4,
      data: {
        registrar: "NameCheap, Inc.",
        organization: "REDACTED FOR PRIVACY",
        country: "US",
        creation_date: "2014-06-12",
        expiration_date: "2026-06-12",
        updated_date: "2024-05-20",
        name_servers: ["dns1.registrar-servers.com", "dns2.registrar-servers.com"],
        status: ["clientTransferProhibited"],
      },
    },
    {
      id: "virustotal",
      name: "VirusTotal",
      icon: "shield-alert",
      status: "success",
      summary: "Reputation: 0 · 1 vendor flagged as suspicious",
      risk_contribution: 12,
      data: {
        reputation: 0,
        last_analysis_date: "2025-12-09T11:00:00Z",
        stats: { harmless: 84, malicious: 0, suspicious: 1, undetected: 9, timeout: 0 },
        categories: { Webroot: "Information Technology", BitDefender: "Computers and Software" },
      },
    },
    {
      id: "subfinder",
      name: "Subfinder",
      icon: "git-branch",
      status: "success",
      summary: "Discovered 14 subdomains across 6 sources",
      risk_contribution: 6,
      data: {
        subdomains: [
          "www." + q,
          "api." + q,
          "mail." + q,
          "vpn." + q,
          "dev." + q,
          "staging." + q,
          "portal." + q,
          "admin." + q,
          "git." + q,
          "jira." + q,
          "ci." + q,
          "monitor." + q,
          "old." + q,
          "test." + q,
        ],
      },
    },
    {
      id: "httpx",
      name: "httpx Live Hosts",
      icon: "activity",
      status: "success",
      summary: "9 of 14 subdomains responded · 2 outdated technologies",
      risk_contribution: 18,
      data: {
        live_hosts: [
          { host: "www." + q, status: 200, title: "Welcome", tech: ["Nginx 1.20", "WordPress 6.4"] },
          { host: "api." + q, status: 200, title: "API Gateway", tech: ["Kong 3.4"] },
          { host: "vpn." + q, status: 200, title: "Pulse Secure", tech: ["Pulse 9.1.10"] },
          { host: "admin." + q, status: 401, title: "Login required", tech: ["Apache 2.4.49"] },
          { host: "old." + q, status: 200, title: "Legacy Portal", tech: ["PHP 5.6"] },
          { host: "git." + q, status: 200, title: "Gitea", tech: ["Gitea 1.18.0"] },
          { host: "monitor." + q, status: 200, title: "Grafana", tech: ["Grafana 9.2.1"] },
          { host: "jira." + q, status: 302, title: "Atlassian Jira", tech: ["Jira 8.13"] },
          { host: "portal." + q, status: 200, title: "Customer Portal", tech: ["React 18"] },
        ],
      },
    },
    {
      id: "harvester",
      name: "theHarvester",
      icon: "wheat",
      status: "success",
      summary: "Surfaced 23 emails and 6 hosts via passive sources",
      risk_contribution: 4,
      data: {
        hosts: ["www." + q, "mail." + q, "vpn." + q, "smtp." + q, "imap." + q, "owa." + q],
        emails: [`admin@${q}`, `info@${q}`, `support@${q}`, `hr@${q}`, `careers@${q}`],
        ips: ["203.0.113.10", "203.0.113.42"],
        urls: [`https://${q}/about`, `https://${q}/careers`],
      },
    },
    {
      id: "otx",
      name: "AlienVault OTX",
      icon: "satellite",
      status: "success",
      summary: "2 pulses reference this domain · last 30 days",
      risk_contribution: 8,
      data: {
        pulses: [
          { name: "Phishing campaign Q4 2025", author: "AlienVault", created: "2025-11-04" },
          { name: "Suspicious SSL fingerprints", author: "ThreatLab", created: "2025-12-01" },
        ],
        passive_dns_count: 318,
      },
    },
    {
      id: "shodan",
      name: "Shodan",
      icon: "server",
      status: "not_applicable",
      summary: "Shodan applies to IP indicators — run on resolved IP",
      risk_contribution: 0,
      data: { reason: "Resolve domain to IP and re-run for host-level results." },
    },
  ];
  const r = baseResponse(q, "domain", modules);
  r.findings = [
    { severity: "critical", text: "Outdated PHP 5.6 stack on legacy.* — actively reachable." },
    { severity: "high", text: "Apache 2.4.49 on admin.* is vulnerable to CVE-2021-41773 path traversal." },
    { severity: "medium", text: "VPN host advertises Pulse Secure 9.1.10 — auditable for known CVEs." },
    { severity: "medium", text: "Domain referenced in 2 active threat-intel pulses on AlienVault OTX." },
    { severity: "low", text: "WHOIS privacy enabled — registrant identity not exposed." },
  ];
  r.timeline = [
    { ts: "2014-06-12T00:00:00Z", title: "Domain registered", source: "WHOIS", severity: "info" },
    { ts: "2024-05-20T00:00:00Z", title: "Registrar record updated", source: "WHOIS", severity: "low" },
    { ts: "2025-11-04T00:00:00Z", title: "Mentioned in phishing pulse", source: "AlienVault OTX", severity: "high" },
    { ts: "2025-12-01T00:00:00Z", title: "Suspicious SSL fingerprint reported", source: "AlienVault OTX", severity: "medium" },
    { ts: "2025-12-09T11:00:00Z", title: "Last VirusTotal scan", source: "VirusTotal", severity: "info" },
  ];
  return r;
};

// ------- IP -------
const ipResponse = (q) => {
  const modules = [
    {
      id: "shodan",
      name: "Shodan",
      icon: "server",
      status: "success",
      summary: "Host online · 6 open ports · Linux Ubuntu 22.04",
      risk_contribution: 22,
      data: {
        host: q,
        organization: "Hetzner Online GmbH",
        country: "Germany",
        city: "Falkenstein",
        os: "Linux 5.15",
        last_seen: "2025-12-10T03:14:00Z",
        ports: [22, 80, 443, 3306, 5432, 9200],
        services: [
          { port: 22, service: "SSH", banner: "OpenSSH 8.9p1 Ubuntu-3ubuntu0.1" },
          { port: 80, service: "HTTP", banner: "nginx/1.20.1" },
          { port: 443, service: "HTTPS", banner: "nginx/1.20.1 · TLS 1.3" },
          { port: 3306, service: "MySQL", banner: "5.7.43 (vulnerable to CVE-2023-21980)" },
          { port: 5432, service: "PostgreSQL", banner: "PostgreSQL 14.7" },
          { port: 9200, service: "Elasticsearch", banner: "Elasticsearch 7.10 (deprecated)" },
        ],
      },
    },
    {
      id: "virustotal",
      name: "VirusTotal",
      icon: "shield-alert",
      status: "success",
      summary: "Flagged malicious by 3 vendors · Reputation: -8",
      risk_contribution: 30,
      data: {
        reputation: -8,
        last_analysis_date: "2025-12-08T22:00:00Z",
        stats: { harmless: 70, malicious: 3, suspicious: 2, undetected: 12, timeout: 0 },
        categories: {},
      },
    },
    {
      id: "otx",
      name: "AlienVault OTX",
      icon: "satellite",
      status: "success",
      summary: "Listed in 4 active pulses · likely command & control",
      risk_contribution: 22,
      data: {
        pulses: [
          { name: "Cobalt Strike infrastructure", author: "USB-Threat", created: "2025-11-18" },
          { name: "Mirai botnet C2", author: "GreyNoise", created: "2025-12-01" },
          { name: "Brute force scanners", author: "AlienVault", created: "2025-12-04" },
          { name: "Recent abuse reports", author: "AbuseIPDB", created: "2025-12-09" },
        ],
        passive_dns_count: 87,
      },
    },
    {
      id: "whois",
      name: "WHOIS",
      icon: "globe",
      status: "success",
      summary: "Net range owned by Hetzner · DE",
      risk_contribution: 0,
      data: {
        registrar: "Hetzner Online GmbH",
        organization: "Hetzner Online GmbH",
        country: "DE",
        netrange: "203.0.113.0/24",
        creation_date: "2009-08-12",
        updated_date: "2024-04-02",
      },
    },
    {
      id: "github",
      name: "GitHub Intelligence",
      icon: "github",
      status: "not_applicable",
      summary: "GitHub doesn't index by IP — module skipped",
      risk_contribution: 0,
      data: { reason: "Run on a username or email instead." },
    },
  ];
  const r = baseResponse(q, "ip", modules);
  r.findings = [
    { severity: "critical", text: "IP listed as Cobalt Strike C2 infrastructure on AlienVault OTX (Nov 2025)." },
    { severity: "critical", text: "VirusTotal: 3 vendors flag this host as malicious." },
    { severity: "high", text: "Exposed Elasticsearch 7.10 on port 9200 — deprecated and frequently abused." },
    { severity: "medium", text: "MySQL 5.7.43 banner indicates susceptibility to CVE-2023-21980." },
    { severity: "low", text: "Host is hosted on Hetzner (Germany) — common in cybercrime infrastructure." },
  ];
  r.timeline = [
    { ts: "2009-08-12T00:00:00Z", title: "IP block allocated to Hetzner", source: "WHOIS", severity: "info" },
    { ts: "2025-11-18T00:00:00Z", title: "Identified as Cobalt Strike C2", source: "AlienVault OTX", severity: "critical" },
    { ts: "2025-12-01T00:00:00Z", title: "Mirai C2 listing", source: "AlienVault OTX", severity: "critical" },
    { ts: "2025-12-04T00:00:00Z", title: "Brute force scanning observed", source: "AlienVault OTX", severity: "high" },
    { ts: "2025-12-08T22:00:00Z", title: "Last VirusTotal scan", source: "VirusTotal", severity: "high" },
    { ts: "2025-12-10T03:14:00Z", title: "Last Shodan banner observation", source: "Shodan", severity: "medium" },
  ];
  return r;
};

export const detectQueryType = (q) => {
  if (!q) return "username";
  const trimmed = q.trim();
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) return "ip";
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "email";
  // Domain
  if (/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(trimmed)) return "domain";
  return "username";
};

export const buildMockResult = (query, queryType) => {
  const type = queryType || detectQueryType(query);
  switch (type) {
    case "email":
      return emailResponse(query);
    case "domain":
      return domainResponse(query);
    case "ip":
      return ipResponse(query);
    case "username":
    default:
      return usernameResponse(query);
  }
};

export const MODULE_CATALOG = [
  { id: "github", name: "GitHub Intelligence", desc: "Public profiles, repositories, contribution patterns.", indicators: ["username", "email"], category: "Identity" },
  { id: "whois", name: "WHOIS", desc: "Domain & IP registration metadata.", indicators: ["domain", "ip"], category: "Infrastructure" },
  { id: "virustotal", name: "VirusTotal", desc: "Multi-engine reputation scoring & detections.", indicators: ["domain", "ip"], category: "Threat Intel" },
  { id: "shodan", name: "Shodan", desc: "Internet-wide host & service banner enumeration.", indicators: ["ip"], category: "Infrastructure" },
  { id: "otx", name: "AlienVault OTX", desc: "Crowd-sourced threat intelligence pulses.", indicators: ["domain", "ip"], category: "Threat Intel" },
  { id: "harvester", name: "theHarvester", desc: "Passive enumeration of hosts, emails, IPs, URLs.", indicators: ["domain", "email"], category: "Recon" },
  { id: "subfinder", name: "Subfinder", desc: "Subdomain discovery across passive sources.", indicators: ["domain"], category: "Recon" },
  { id: "httpx", name: "httpx Live Hosts", desc: "HTTP probing for live host enumeration & tech.", indicators: ["domain"], category: "Recon" },
  { id: "maigret", name: "Maigret", desc: "Cross-platform username presence scan.", indicators: ["username"], category: "Identity" },
  { id: "ghunt", name: "GHunt", desc: "Public Google account & service enumeration.", indicators: ["email", "username"], category: "Identity" },
  { id: "holehe", name: "Holehe", desc: "Email registration footprint across services.", indicators: ["email"], category: "Identity" },
  { id: "userscanner", name: "UserScanner", desc: "Aggregated cross-network username correlation.", indicators: ["username"], category: "Identity" },
];
