import React from "react";

export function Card(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl2 bg-panel/70 border border-border shadow-soft p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-text font-semibold">{props.title}</div>
        {props.subtitle ? <div className="text-xs text-muted">{props.subtitle}</div> : null}
      </div>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}
