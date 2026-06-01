import React from "react";

const LEVELS = {
  critical: {
    label: "Critical",
    color: "#ef4444",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-300",
  },
  high: {
    label: "High",
    color: "#f59e0b",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-300",
  },
  medium: {
    label: "Medium",
    color: "#3b82f6",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-300",
  },
  low: {
    label: "Low",
    color: "#10b981",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
  },
};

export default function RiskBadge({ level = "low", score, size = "md" }) {
  const meta = LEVELS[level] || LEVELS.low;
  const sizes = {
    sm: "text-[10px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-2",
    lg: "text-sm px-3 py-1.5 gap-2",
  };
  return (
    <span
      data-testid={`risk-badge-${level}`}
      className={`inline-flex items-center rounded-md border font-mono uppercase tracking-wider ${meta.bg} ${meta.border} ${meta.text} ${sizes[size]} ${level === "critical" ? "danger-pulse" : ""}`}
    >
      <span
        className="relative w-1.5 h-1.5 rounded-full glow-dot"
        style={{ background: meta.color, color: meta.color }}
      />
      {meta.label}
      {typeof score === "number" && (
        <span className="text-slate-400 normal-case ml-1">· {score}</span>
      )}
    </span>
  );
}
