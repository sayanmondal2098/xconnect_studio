import React from "react";
import { nodeTemplates } from "./nodeRegistry";

export default function NodePalette() {
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted">Drag a node onto the canvas.</div>
      <div className="grid grid-cols-1 gap-2">
        {nodeTemplates.map((t, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-xconnect-node", JSON.stringify(t));
              e.dataTransfer.effectAllowed = "move";
            }}
            className="rounded-xl2 bg-panel2 border border-border px-3 py-3 cursor-grab active:cursor-grabbing hover:border-lavender/60"
          >
            <div className="font-semibold text-sm">{t.data.title}</div>
            <div className="text-xs text-muted mt-1">{t.data.subtitle}</div>
            <div className="text-[11px] text-muted mt-2">
              <span className="text-mint">{t.data.provider}</span> • {t.data.op}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
