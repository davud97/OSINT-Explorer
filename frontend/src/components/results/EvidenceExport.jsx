import React from "react";
import { FileDown, Package, FileJson } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

export default function EvidenceExport({ result }) {
  const exportPdf = () => {
    if (!result) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;

    // Header band
    doc.setFillColor(11, 19, 32);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 70, "F");
    doc.setTextColor(0, 229, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("OSINT EXPLORER · EVIDENCE REPORT", margin, 30);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated ${new Date().toISOString()}`, margin, 50);

    y = 100;

    // Summary
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Investigation Summary", margin, y);
    y += 16;

    autoTable(doc, {
      startY: y,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 4 },
      body: [
        ["Query", result.query],
        ["Type", result.queryType],
        ["Timestamp", result.timestamp],
        ["Risk Level", `${result.risk.level.toUpperCase()} (${result.risk.score})`],
        ["Sources Queried", result.summary.sourcesQueried],
        ["Sources With Results", result.summary.sourcesWithResults],
        ["Errors", result.summary.errors],
        ["No Results", result.summary.noResults],
        ["Investigation ID", result.id],
      ],
    });
    y = doc.lastAutoTable.finalY + 16;

    // Findings
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Key Findings", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y + 4,
      head: [["Severity", "Finding"]],
      body: result.findings.map((f) => [f.severity.toUpperCase(), f.text]),
      headStyles: { fillColor: [7, 14, 26], textColor: [0, 229, 255] },
      styles: { fontSize: 9, cellPadding: 5 },
    });
    y = doc.lastAutoTable.finalY + 16;

    // Modules
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Module Results", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y + 4,
      head: [["Module", "Status", "Summary"]],
      body: result.modules.map((m) => [m.name, m.status, m.summary]),
      headStyles: { fillColor: [7, 14, 26], textColor: [0, 229, 255] },
      styles: { fontSize: 9, cellPadding: 5 },
    });
    y = doc.lastAutoTable.finalY + 16;

    // Timeline
    if (y > 720) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Timeline", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y + 4,
      head: [["Timestamp", "Source", "Severity", "Event"]],
      body: result.timeline.map((e) => [e.ts, e.source, e.severity, e.title]),
      headStyles: { fillColor: [7, 14, 26], textColor: [0, 229, 255] },
      styles: { fontSize: 9, cellPadding: 5 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Use this platform only for authorized security research, compliance, and investigation purposes.",
        margin,
        doc.internal.pageSize.getHeight() - 20
      );
      doc.text(
        `Page ${i} / ${pageCount}`,
        doc.internal.pageSize.getWidth() - margin - 50,
        doc.internal.pageSize.getHeight() - 20
      );
    }

    doc.save(`osint-report-${result.query.replace(/[^a-z0-9]/gi, "_")}.pdf`);
  };

  const exportEvidence = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    saveAs(blob, `osint-evidence-${result.query.replace(/[^a-z0-9]/gi, "_")}.json`);
  };

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    saveAs(blob, `osint-${result.query.replace(/[^a-z0-9]/gi, "_")}.json`);
  };

  return (
    <div data-testid="evidence-export-card" className="cyber-card">
      <div className="card-strip" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading text-base font-medium text-white tracking-tight">
              Export Evidence
            </h3>
            <p className="text-[12px] text-slate-400 font-body mt-1">
              Generate audit-ready reports from this investigation.
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Forensics
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            data-testid="export-pdf-btn"
            onClick={exportPdf}
            className="group flex items-center gap-3 px-4 py-3 rounded-md border border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/10 hover:border-cyan-400/50 transition-all"
          >
            <FileDown className="w-4 h-4 text-cyan-300" strokeWidth={1.75} />
            <span className="text-[13px] font-body text-cyan-100">Export PDF Report</span>
          </button>
          <button
            data-testid="export-evidence-btn"
            onClick={exportEvidence}
            className="group flex items-center gap-3 px-4 py-3 rounded-md border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40 transition-all"
          >
            <Package className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
            <span className="text-[13px] font-body text-slate-100">Evidence Package</span>
          </button>
          <button
            data-testid="export-json-btn"
            onClick={exportJson}
            className="group flex items-center gap-3 px-4 py-3 rounded-md border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40 transition-all"
          >
            <FileJson className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
            <span className="text-[13px] font-body text-slate-100">Raw JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
