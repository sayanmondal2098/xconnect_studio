import React from "react";
import { Handle, Position } from "reactflow";
import type { WorkflowNodeData } from "../lib/types";

export default function BasicNode(props: { data: WorkflowNodeData }) {
  const accent =
    props.data.provider === "github" ? "border-sky/50" :
    props.data.provider === "servicenow" ? "border-mint/50" :
    "border-lavender/50";

  return (
    <div className={`rounded-xl2 bg-panel border ${accent} shadow-soft min-w-[210px]`}>
      <div className="px-3 py-2 border-b border-border">
        <div className="text-sm font-semibold">{props.data.title}</div>
        {props.data.subtitle ? <div className="text-xs text-muted mt-0.5">{props.data.subtitle}</div> : null}
      </div>
      <div className="px-3 py-2 text-[11px] text-muted">
        {props.data.provider} • {props.data.op}
      </div>

      <Handle type="target" position={Position.Left} className="!bg-lavender !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-mint !border-0" />
    </div>
  );
}
