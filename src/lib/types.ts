import type { Edge, Node } from "reactflow";

export type NodeKind = "trigger" | "action";

export type WorkflowNodeData = {
  title: string;
  subtitle?: string;
  kind: NodeKind;
  provider: "github" | "servicenow" | "utility";
  op: string;
  config: Record<string, any>;
};

export type WorkflowDef = {
  id?: number;
  name: string;
  description?: string;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  updated_at?: string;
};
