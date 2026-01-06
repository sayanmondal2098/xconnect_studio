import React from "react";
import { useWorkflowStore } from "../state/workflowStore";
import type { WorkflowNodeData } from "../lib/types";
import { TextField } from "./TextField";

export default function Inspector() {
  const { workflow, selectedNodeId, updateNodeData } = useWorkflowStore();
  const node = workflow.nodes.find((n) => n.id === selectedNodeId);

  if (!node) return <div className="text-sm text-muted">Select a node to edit its settings.</div>;

  const data = node.data as WorkflowNodeData;

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted">Node</div>

      <TextField label="Title" value={data.title} onChange={(v) => updateNodeData(node.id, { title: v })} />
      <TextField label="Subtitle" value={data.subtitle ?? ""} onChange={(v) => updateNodeData(node.id, { subtitle: v })} />

      <label className="block">
        <div className="text-xs text-muted mb-1">Config (JSON)</div>
        <textarea
          className="w-full h-40 px-3 py-2 rounded-xl2 bg-panel2 border border-border outline-none focus:ring-2 focus:ring-lavender/40 font-mono text-xs"
          value={JSON.stringify(data.config ?? {}, null, 2)}
          onChange={(e) => {
            try { updateNodeData(node.id, { config: JSON.parse(e.target.value) }); } catch {}
          }}
        />
      </label>

      <div className="text-[11px] text-muted">
        <span className="text-lemon">Tip:</span> keep config small. Your future self already hates you.
      </div>
    </div>
  );
}
