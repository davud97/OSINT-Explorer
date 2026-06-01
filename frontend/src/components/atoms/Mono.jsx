import React from "react";

export default function Mono({ children, className = "", color = "text-slate-200" }) {
  return (
    <span className={`font-mono ${color} ${className}`}>{children}</span>
  );
}
