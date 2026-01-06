import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Edge, Node, Viewport } from "reactflow";
import type { WorkflowDef, WorkflowNodeData } from "../lib/types";

type State = {
  workflow: WorkflowDef;
  viewport: Viewport;
  selectedNodeId: string | null;

  setWorkflow: (wf: WorkflowDef) => void;
  setWorkflowName: (name: string) => void;
  setNodes: (nodes: Node<WorkflowNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (v: Viewport) => void;

  selectNode: (id: string | null) => void;
  updateNodeData: (id: string, patch: Partial<WorkflowNodeData>) => void;
  reset: () => void;
};

const DEFAULT: Pick<State, "workflow" | "viewport" | "selectedNodeId"> = {
  workflow: { name: "Untitled workflow", nodes: [], edges: [] },
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
};

function sanitize(wf: WorkflowDef): WorkflowDef {
  const nodes = Array.isArray(wf.nodes) ? wf.nodes : [];
  const edges = Array.isArray(wf.edges) ? wf.edges : [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Drop edges pointing to missing nodes (common cause of ReactFlow tantrums)
  const safeEdges = edges.filter((e) => nodeIds.has((e as any).source) && nodeIds.has((e as any).target));

  // Ensure every node has position (ReactFlow can crash if undefined sneaks in)
  const safeNodes = nodes.map((n) => ({
    ...n,
    position: (n as any).position ?? { x: 0, y: 0 },
    data: (n as any).data ?? {},
  }));

  return { name: wf.name || "Untitled workflow", nodes: safeNodes as any, edges: safeEdges as any };
}

export const useWorkflowStore = create<State>()(
  persist(
    (set, get) => ({
      ...DEFAULT,

      setWorkflow: (wf) => set({ workflow: sanitize(wf) }),
      setWorkflowName: (name) => set({ workflow: sanitize({ ...get().workflow, name }) }),
      setNodes: (nodes) => set({ workflow: sanitize({ ...get().workflow, nodes }) }),
      setEdges: (edges) => set({ workflow: sanitize({ ...get().workflow, edges }) }),
      setViewport: (v) => set({ viewport: v }),

      selectNode: (id) => set({ selectedNodeId: id }),

      updateNodeData: (id, patch) => {
        const wf = get().workflow;
        const nodes = wf.nodes.map((n: any) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
        set({ workflow: sanitize({ ...wf, nodes }) });
      },

      reset: () => set({ ...DEFAULT }),
    }),
    {
      name: "xconnect_workflow",
      version: 2,
      partialize: (s) => ({ workflow: s.workflow, viewport: s.viewport }),
      migrate: (persisted: any, version) => {
        if (!persisted) return DEFAULT;
        if (version < 2) {
          return { ...DEFAULT, workflow: sanitize(persisted.workflow ?? DEFAULT.workflow), viewport: persisted.viewport ?? DEFAULT.viewport };
        }
        return { ...DEFAULT, ...persisted, workflow: sanitize(persisted.workflow ?? DEFAULT.workflow) };
      },
    }
  )
);
