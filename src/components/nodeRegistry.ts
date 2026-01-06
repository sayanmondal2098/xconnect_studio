import type { WorkflowNodeData } from "../lib/types";

export type NodeTemplate = { type: string; data: WorkflowNodeData; };

export const nodeTemplates: NodeTemplate[] = [
  {
    type: "basicNode",
    data: { title: "Webhook Trigger", subtitle: "Starts on HTTP call", kind: "trigger", provider: "utility", op: "trigger.webhook", config: { path: "/webhook/my-flow" } },
  },
  {
    type: "basicNode",
    data: { title: "GitHub: List Repos", subtitle: "Fetch repositories", kind: "action", provider: "github", op: "github.list_repos", config: { label: "default" } },
  },
  {
    type: "basicNode",
    data: { title: "ServiceNow: Create Record", subtitle: "Insert into table", kind: "action", provider: "servicenow", op: "servicenow.create_record", config: { label: "default", table: "incident", fields: { short_description: "Hello" } } },
  },
  {
    type: "basicNode",
    data: { title: "Utility: Transform", subtitle: "Map / shape JSON", kind: "action", provider: "utility", op: "util.transform", config: { mapping: {} } },
  },
];
