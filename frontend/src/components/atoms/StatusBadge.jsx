import React from "react";
import { CheckCircle2, XCircle, MinusCircle, AlertOctagon } from "lucide-react";

const STATUS = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    color: "text-emerald-300",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    dot: "#10b981",
  },
  no_results: {
    label: "No Results",
    icon: MinusCircle,
    color: "text-slate-400",
    border: "border-slate-600/40",
    bg: "bg-slate-500/10",
    dot: "#64748b",
  },
  error: {
    label: "Error",
    icon: AlertOctagon,
    color: "text-red-300",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    dot: "#ef4444",
  },
  not_applicable: {
    label: "N/A",
    icon: XCircle,
    color: "text-blue-300",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    dot: "#3b82f6",
  },
  pending: {
    label: "Scanning",
    icon: CheckCircle2,
    color: "text-cyan-300",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    dot: "#00e5ff",
  },
};

export default function StatusBadge({ status = "success" }) {
  const meta = STATUS[status] || STATUS.success;
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wider border ${meta.bg} ${meta.border} ${meta.color}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: meta.dot, boxShadow: `0 0 6px ${meta.dot}` }}
      />
      {meta.label}
    </span>
  );
}
