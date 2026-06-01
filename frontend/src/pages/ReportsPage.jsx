import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import RiskBadge from "../components/atoms/RiskBadge";
import { FileText, Trash2, FileDown, Package } from "lucide-react";
import { loadReports, removeReport } from "../lib/storage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const remove = (id) => {
    removeReport(id);
    setReports(loadReports());
  };

  const downloadPdf = (result) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`OSINT Report — ${result.query}`, 40, 50);
    autoTable(doc, {
      startY: 70,
      head: [["Module", "Status", "Summary"]],
      body: result.modules.map((m) => [m.name, m.status, m.summary]),
      styles: { fontSize: 9 },
    });
    doc.save(`osint-report-${result.query}.pdf`);
  };

  const downloadJson = (result) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    saveAs(blob, `osint-evidence-${result.query}.json`);
  };

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 mb-2">
            Saved
          </div>
          <h1 className="font-heading font-semibold text-3xl text-white tracking-tight">
            Reports
          </h1>
          <p className="text-slate-400 font-body text-sm mt-1">
            Pinned investigations available for export and review.
          </p>
        </div>

        {reports.length === 0 && (
          <div className="cyber-card p-10 text-center">
            <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" strokeWidth={1.5} />
            <div className="font-body text-slate-400 text-sm">
              No saved reports. Save investigations from the Results page to see them here.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => {
            const f = r.full;
            return (
              <div key={r.id} data-testid={`report-card-${r.id}`} className="cyber-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link
                      to={`/results?q=${encodeURIComponent(f.query)}&type=${f.queryType}&t=${Date.now()}`}
                      className="font-heading text-[15px] font-medium text-white hover:text-cyan-200 transition-colors block truncate"
                    >
                      {f.query}
                    </Link>
                    <div className="font-mono text-[11px] text-slate-500 mt-1">
                      {f.queryType} · saved {new Date(r.savedAt).toLocaleString()}
                    </div>
                  </div>
                  <RiskBadge level={f.risk.level} score={f.risk.score} size="sm" />
                </div>

                <div className="grid grid-cols-3 gap-px bg-slate-800 rounded-md overflow-hidden border border-slate-800 mb-3">
                  <Stat label="Sources" value={f.summary.sourcesQueried} />
                  <Stat label="Hits" value={f.summary.sourcesWithResults} />
                  <Stat label="Findings" value={f.findings.length} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    data-testid={`report-pdf-${r.id}`}
                    onClick={() => downloadPdf(f)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-cyan-400/30 bg-cyan-400/5 text-cyan-200 hover:bg-cyan-400/10 transition-all"
                  >
                    <FileDown className="w-3.5 h-3.5" strokeWidth={1.75} /> PDF
                  </button>
                  <button
                    data-testid={`report-json-${r.id}`}
                    onClick={() => downloadJson(f)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-800 bg-slate-900/40 text-slate-200 hover:bg-slate-800/60 transition-all"
                  >
                    <Package className="w-3.5 h-3.5" strokeWidth={1.75} /> JSON
                  </button>
                  <button
                    data-testid={`report-delete-${r.id}`}
                    onClick={() => remove(r.id)}
                    className="ml-auto text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

const Stat = ({ label, value }) => (
  <div className="bg-[#0B1320] px-3 py-2">
    <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
    <div className="font-heading text-base text-white tabular">{value}</div>
  </div>
);
