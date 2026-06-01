import React from "react";
import { ExternalLink } from "lucide-react";

const SafeLink = ({ href, children }) => (
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

const KV = ({ label, value, mono = false }) => (
  <div className="flex flex-col gap-1 py-2 border-b border-slate-800/60 last:border-0">
    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
      {label}
    </span>
    <span className={`text-[13px] text-slate-100 break-all ${mono ? "font-mono" : "font-body"}`}>
      {value || <span className="text-slate-600">—</span>}
    </span>
  </div>
);

const Th = ({ children, className = "" }) => (
  <th className={`text-left font-mono text-[10px] uppercase tracking-widest text-slate-500 px-3 py-2 ${className}`}>
    {children}
  </th>
);
const Td = ({ children, className = "" }) => (
  <td className={`px-3 py-2 text-[12.5px] text-slate-200 font-body ${className}`}>
    {children}
  </td>
);
const Table = ({ children }) => (
  <div className="overflow-x-auto rounded-md border border-slate-800">
    <table className="w-full">{children}</table>
  </div>
);

const ErrorBox = ({ msg }) => (
  <div className="p-3 rounded-md border border-red-500/30 bg-red-500/5 text-[13px] text-red-300 font-body">
    {msg}
  </div>
);
const InfoBox = ({ msg }) => (
  <div className="p-3 rounded-md border border-blue-500/20 bg-blue-500/5 text-[13px] text-blue-200 font-body">
    {msg}
  </div>
);

export const GithubModule = ({ module }) => {
  const d = module.data || {};
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {d.avatar && (
          <img
            src={d.avatar}
            alt="avatar"
            className="w-16 h-16 rounded-md border border-slate-800"
          />
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 flex-1">
          <KV label="Username" value={d.username} mono />
          <KV label="Name" value={d.name} />
          <KV label="Company" value={d.company} mono />
          <KV label="Location" value={d.location} />
          <KV label="Account Created" value={d.created_at?.slice(0, 10)} mono />
          <KV
            label="Profile"
            value={d.profile_url ? <SafeLink href={d.profile_url}>{d.profile_url}</SafeLink> : null}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-px bg-slate-800 rounded-md overflow-hidden border border-slate-800">
        <Stat label="Public Repos" value={d.public_repos} />
        <Stat label="Followers" value={d.followers} />
        <Stat label="Following" value={d.following} />
      </div>
      {d.repositories?.length > 0 && (
        <Table>
          <thead className="bg-slate-900/60">
            <tr>
              <Th>Repository</Th>
              <Th>Language</Th>
              <Th>Stars</Th>
              <Th>Last Update</Th>
            </tr>
          </thead>
          <tbody>
            {d.repositories.map((r, i) => (
              <tr key={i} className="border-t border-slate-800/60 hover:bg-slate-800/20">
                <Td className="font-mono text-cyan-200">{r.name}</Td>
                <Td>{r.lang}</Td>
                <Td className="font-mono">{r.stars}</Td>
                <Td className="font-mono text-slate-400">{r.updated}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-[#0B1320] px-4 py-3">
    <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
      {label}
    </div>
    <div className="font-heading text-lg text-white tabular">{value ?? "—"}</div>
  </div>
);

export const WhoisModule = ({ module }) => {
  const d = module.data || {};
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
      <KV label="Registrar" value={d.registrar} />
      <KV label="Organization" value={d.organization} />
      <KV label="Country" value={d.country} mono />
      <KV label="Net Range" value={d.netrange} mono />
      <KV label="Creation Date" value={d.creation_date} mono />
      <KV label="Expiration Date" value={d.expiration_date} mono />
      <KV label="Updated Date" value={d.updated_date} mono />
      <KV
        label="Status"
        value={d.status?.length ? d.status.join(", ") : null}
        mono
      />
      {d.name_servers?.length > 0 && (
        <div className="md:col-span-2 mt-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            Name Servers
          </div>
          <div className="flex flex-wrap gap-2">
            {d.name_servers.map((ns) => (
              <span key={ns} className="px-2 py-1 rounded border border-slate-800 bg-slate-900/40 font-mono text-[12px] text-slate-200">
                {ns}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const VirusTotalModule = ({ module }) => {
  if (module.status === "error") return <ErrorBox msg={module.data?.error || "VirusTotal request failed."} />;
  const d = module.data || {};
  const s = d.stats || {};
  const cells = [
    { label: "Reputation", value: d.reputation, color: d.reputation < 0 ? "text-red-300" : "text-emerald-300" },
    { label: "Malicious", value: s.malicious, color: "text-red-300" },
    { label: "Suspicious", value: s.suspicious, color: "text-amber-300" },
    { label: "Harmless", value: s.harmless, color: "text-emerald-300" },
    { label: "Undetected", value: s.undetected, color: "text-slate-300" },
    { label: "Timeouts", value: s.timeout, color: "text-slate-400" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-slate-800 rounded-md overflow-hidden border border-slate-800">
        {cells.map((c) => (
          <div key={c.label} className="bg-[#0B1320] px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {c.label}
            </div>
            <div className={`font-heading text-lg tabular ${c.color}`}>
              {c.value ?? "—"}
            </div>
          </div>
        ))}
      </div>
      <KV label="Last Analysis" value={d.last_analysis_date} mono />
      {d.categories && Object.keys(d.categories).length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">Categories</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(d.categories).map(([k, v]) => (
              <span key={k} className="font-mono text-[12px] px-2 py-1 rounded border border-slate-800 bg-slate-900/40 text-slate-300">
                <span className="text-slate-500">{k}:</span> {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ShodanModule = ({ module }) => {
  const d = module.data || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
        <KV label="Host" value={d.host} mono />
        <KV label="Organization" value={d.organization} />
        <KV label="OS" value={d.os} mono />
        <KV label="City" value={d.city} />
        <KV label="Country" value={d.country} mono />
        <KV label="Last Seen" value={d.last_seen} mono />
      </div>
      {d.ports?.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            Open Ports ({d.ports.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {d.ports.map((p) => (
              <span key={p} className="font-mono text-[12px] px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/5 text-amber-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
      {d.services?.length > 0 && (
        <Table>
          <thead className="bg-slate-900/60">
            <tr>
              <Th>Port</Th>
              <Th>Service</Th>
              <Th>Banner</Th>
            </tr>
          </thead>
          <tbody>
            {d.services.map((s, i) => (
              <tr key={i} className="border-t border-slate-800/60">
                <Td className="font-mono text-cyan-200">{s.port}</Td>
                <Td className="font-mono">{s.service}</Td>
                <Td className="font-mono text-slate-300">{s.banner}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export const HarvesterModule = ({ module }) => {
  const d = module.data || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 rounded-md overflow-hidden border border-slate-800">
        <Stat label="Hosts Found" value={d.hosts?.length || 0} />
        <Stat label="Emails Found" value={d.emails?.length || 0} />
        <Stat label="IPs Found" value={d.ips?.length || 0} />
        <Stat label="URLs Found" value={d.urls?.length || 0} />
      </div>
      {d.emails?.length > 0 && (
        <ListSection title="Emails" items={d.emails} />
      )}
      {d.hosts?.length > 0 && <ListSection title="Hosts" items={d.hosts} />}
      {d.ips?.length > 0 && <ListSection title="IPs" items={d.ips} />}
    </div>
  );
};

const ListSection = ({ title, items }) => (
  <div>
    <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
      {title}
    </div>
    <div className="flex flex-wrap gap-2">
      {items.map((x) => (
        <span key={x} className="font-mono text-[12px] px-2 py-1 rounded border border-slate-800 bg-slate-900/40 text-slate-200">
          {x}
        </span>
      ))}
    </div>
  </div>
);

export const HoleheModule = ({ module }) => {
  const d = module.data || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px bg-slate-800 rounded-md overflow-hidden border border-slate-800">
        <Stat label="Websites Checked" value={d.checked_count || "—"} />
        <Stat label="Accounts Found" value={d.platforms?.length || 0} />
      </div>

      {!d.platforms?.length ? (
        <InfoBox msg="Holehe checked the email but did not confirm registered platforms." />
      ) : (
        <Table>
          <thead className="bg-slate-900/60">
            <tr>
              <Th>Platform</Th>
              <Th>Account Found</Th>
              <Th>Profile Link</Th>
            </tr>
          </thead>
          <tbody>
            {d.platforms.map((p, i) => (
              <tr key={i} className="border-t border-slate-800/60">
                <Td>{p.name}</Td>
                <Td>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    FOUND
                  </span>
                </Td>
                <Td>
                  {p.link ? (
                    <SafeLink href={p.link}>{p.link}</SafeLink>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export const GhuntModule = ({ module }) => {
  if (module.status === "no_results") {
    return <InfoBox msg="No public Google account found for this indicator." />;
  }

  const d = module.data || {};

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {d.profile_image && (
          <img
            src={d.profile_image}
            alt="Google profile"
            className="w-16 h-16 rounded-md border border-slate-800"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 flex-1">
          <KV label="Email" value={d.email} mono />
          <KV label="Google ID / Gaia ID" value={d.google_id} mono />
          <KV label="Last Profile Edit" value={d.last_active} mono />
          <KV label="Calendar" value={d.calendar} />

          <KV
            label="Maps Profile"
            value={
              d.maps_profile ? (
                <SafeLink href={d.maps_profile}>Open Google Maps Profile</SafeLink>
              ) : null
            }
          />

          <KV
            label="Activated Services"
            value={d.services?.length ? d.services.join(", ") : null}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-slate-800 rounded-md overflow-hidden border border-slate-800">
        <Stat label="Reviews" value={d.reviews ?? 0} />
        <Stat label="Ratings" value={d.ratings ?? 0} />
        <Stat label="Photos" value={d.photos ?? 0} />
        <Stat label="Videos" value={d.videos ?? 0} />
        <Stat label="Answers" value={d.answers ?? 0} />
        <Stat label="Edits" value={d.edits ?? 0} />
      </div>
    </div>
  );
};

export const MaigretModule = ({ module }) => {
  if (module.status === "not_applicable") return <InfoBox msg={module.data?.reason || "Not applicable."} />;
  const d = module.data || {};
  return (
    <Table>
      <thead className="bg-slate-900/60">
        <tr>
          <Th>Site</Th>
          <Th>URL</Th>
          <Th>Category</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {(d.accounts || []).map((a, i) => (
          <tr key={i} className="border-t border-slate-800/60">
            <Td>{a.site}</Td>
            <Td><SafeLink href={a.url}>{a.url}</SafeLink></Td>
            <Td className="text-slate-400">{a.category}</Td>
            <Td>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 uppercase">
                {a.status}
              </span>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export const OtxModule = ({ module }) => {
  const d = module.data || {};
  return (
    <div className="space-y-4">
      <KV label="Passive DNS Records" value={d.passive_dns_count} mono />
      {d.pulses?.length > 0 && (
        <Table>
          <thead className="bg-slate-900/60">
            <tr>
              <Th>Pulse</Th>
              <Th>Author</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {d.pulses.map((p, i) => (
              <tr key={i} className="border-t border-slate-800/60">
                <Td className="text-slate-100">{p.name}</Td>
                <Td className="font-mono text-slate-400">{p.author}</Td>
                <Td className="font-mono text-slate-400">{p.created}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export const SubfinderModule = ({ module }) => {
  const d = module.data || {};
  return (
    <ListSection title={`Subdomains (${d.subdomains?.length || 0})`} items={d.subdomains || []} />
  );
};

export const HttpxModule = ({ module }) => {
  const d = module.data || {};
  return (
    <Table>
      <thead className="bg-slate-900/60">
        <tr>
          <Th>Host</Th>
          <Th>Status</Th>
          <Th>Title</Th>
          <Th>Tech</Th>
        </tr>
      </thead>
      <tbody>
        {(d.live_hosts || []).map((h, i) => {
          const ok = h.status >= 200 && h.status < 400;
          return (
            <tr key={i} className="border-t border-slate-800/60">
              <Td className="font-mono text-cyan-200">{h.host}</Td>
              <Td>
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
                  {h.status}
                </span>
              </Td>
              <Td>{h.title}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {(h.tech || []).map((t) => (
                    <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/40 text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export const UserScannerModule = ({ module }) => {
  const d = module.data || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px bg-slate-800 rounded-md overflow-hidden border border-slate-800">
        <Stat label="Platforms Checked" value={d.platforms_checked} />
        <Stat label="Accounts Found" value={d.accounts_found} />
      </div>
      {d.likely_handles?.length > 0 && (
        <ListSection title="Likely Handles" items={d.likely_handles} />
      )}
    </div>
  );
};

export const GenericInfoModule = ({ module }) => {
  if (module.status === "error")
    return <ErrorBox msg={module.data?.error || "Module failed."} />;
  if (module.status === "no_results")
    return <InfoBox msg="No information returned by this source." />;
  if (module.status === "not_applicable")
    return <InfoBox msg={module.data?.reason || "Module not applicable for this indicator."} />;
  return (
    <pre className="text-[12px] text-slate-300 font-mono overflow-x-auto">
      {JSON.stringify(module.data, null, 2)}
    </pre>
  );
};
