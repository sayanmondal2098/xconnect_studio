import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell";
import { Card } from "../components/Card";
import { useWorkflowStore } from "../state/workflowStore";
import { PlugZap, Workflow, ArrowRight } from "lucide-react";

export default function Workflows() {
  const nav = useNavigate();
  const wf = useWorkflowStore((s) => s.workflow);

  return (
    <Shell title="Workflows">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7">
          <Card title="Your current draft" subtitle="Local-only for now (stored in browser). Backend persistence can come next.">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-text font-semibold">{wf.name}</div>
                <div className="text-xs text-muted mt-1">
                  Nodes: <span className="font-mono">{wf.nodes.length}</span> | Edges:{" "}
                  <span className="font-mono">{wf.edges.length}</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => nav("/studio")}>
                <Workflow className="w-4 h-4" /> Open Studio <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-5 flex flex-col gap-4">
          <Card title="Step 1: Connect systems" subtitle="No connections = no automation. Just vibes.">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted">
                Add GitHub + ServiceNow (or more later). Validate them. Then wire your workflow.
              </div>
              <button className="btn btn-primary" onClick={() => nav("/connections")}>
                <PlugZap className="w-4 h-4" /> Connections
              </button>
            </div>
          </Card>

          <Card title="What’s next" subtitle="After this UI behaves, we can add: runs, logs, schedules, and real triggers.">
            <ul className="text-sm text-muted list-disc pl-5 space-y-1">
              <li>Workflow save/load to backend</li>
              <li>Run history + per-node logs</li>
              <li>Credential scopes + RBAC</li>
              <li>More connectors (Jira, Slack, Google, etc.)</li>
            </ul>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
