import React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  type Viewport,
  getNodesBounds,
  getViewportForBounds,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import Shell from "../components/Shell";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import BasicNode from "../components/BasicNode";
import NodePalette from "../components/NodePalette";
import Inspector from "../components/Inspector";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Toast } from "../components/Toast";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useWorkflowStore } from "../state/workflowStore";
import type { WorkflowNodeData } from "../lib/types";
import { Download, RotateCcw, ImageDown, FileDown, SlidersHorizontal, Play, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

function uid() {
  // crypto.randomUUID is supported in modern browsers; fallback for the rest of the world.
  // (Yes, the world is large. No, it doesn't all update together.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (crypto as any)?.randomUUID?.() ?? `n_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function Studio() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const storeViewport = useWorkflowStore((s) => s.viewport);
  const setWfNodes = useWorkflowStore((s) => s.setNodes);
  const setWfEdges = useWorkflowStore((s) => s.setEdges);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const setViewport = useWorkflowStore((s) => s.setViewport);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const reset = useWorkflowStore((s) => s.reset);

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>(workflow.nodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges as any);

  const rfRef = React.useRef<ReactFlowInstance | null>(null);
  const rfWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const hydrating = React.useRef(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = React.useState(false);
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [name, setName] = React.useState(workflow.name);
  const [runStatus, setRunStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [runLogs, setRunLogs] = React.useState<{ ts: number; level: "info" | "success" | "error"; message: string }[]>([]);
  const [runProgress, setRunProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState<string | null>(null);
  const [currentStepId, setCurrentStepId] = React.useState<string | null>(null);

  const nodeTypes = React.useMemo(() => ({ basic: BasicNode }), []);
  const edgeColor = "rgb(var(--lavender))";
  const defaultEdgeOptions = React.useMemo(
    () => ({
      type: "smoothstep" as const,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 16, height: 16 },
      style: { stroke: edgeColor, strokeWidth: 2 },
    }),
    [edgeColor]
  );
  const connectionLineStyle = React.useMemo(
    () => ({
      stroke: edgeColor,
      strokeWidth: 2,
    }),
    [edgeColor]
  );

  const decoratedNodes = React.useMemo(
    () =>
      nodes.map((n) =>
        currentStepId === n.id ? { ...n, className: "node-active" } : { ...n, className: n.className ?? "" }
      ),
    [nodes, currentStepId]
  );

  const decoratedEdges = React.useMemo(
    () =>
      edges.map((e) =>
        currentStepId && e.source === currentStepId
          ? { ...e, className: "edge-active" }
          : { ...e, className: e.className ?? "" }
      ),
    [edges, currentStepId]
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!exportMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest && t.closest("[data-export-menu]")) return;
      setExportMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [exportMenuOpen]);



  // Re-hydrate local state when store changes (e.g., "Reset canvas state" in Settings)
  React.useEffect(() => {
    hydrating.current = true;
    setNodes(workflow.nodes as any);
    setEdges(workflow.edges as any);
    const t = setTimeout(() => (hydrating.current = false), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow.nodes, workflow.edges]);

  React.useEffect(() => {
    setName(workflow.name);
  }, [workflow.name]);

  // Persist to store
  React.useEffect(() => {
    if (!hydrating.current) setWfNodes(nodes as any);
  }, [nodes, setWfNodes]);
  React.useEffect(() => {
    if (!hydrating.current) setWfEdges(edges as any);
  }, [edges, setWfEdges]);

  function onNameChange(v: string) {
    setName(v);
    setWorkflowName(v);
  }

  function onNameBlur() {
    const trimmed = name.trim() || "Untitled workflow";
    setName(trimmed);
    setWorkflowName(trimmed);
  }

  function pushLog(level: "info" | "success" | "error", message: string) {
    setRunLogs((prev) => [{ ts: Date.now(), level, message }, ...prev].slice(0, 200));
  }

  async function runWorkflow() {
    if (runStatus === "running") return;
    if (!nodes.length) {
      pushLog("error", "Cannot run: add at least one node.");
      setRunStatus("error");
      return;
    }

    setRunStatus("running");
    setRunProgress(0);
    setCurrentStep(null);
    pushLog("info", `Starting run for "${name || "Untitled workflow"}"...`);

    try {
      const steps = nodes.map((n) => ({ id: n.id, title: n.data?.title || n.id, provider: (n.data as any)?.provider }));
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setCurrentStep(step.title);
        setCurrentStepId(step.id);
        pushLog("info", `Step ${i + 1}/${steps.length}: ${step.title} (${step.provider || "node"})`);
        setRunProgress(Math.round(((i + 1) / steps.length) * 100));
        // Lightweight wait to mimic work / animation sync
        await new Promise((res) => setTimeout(res, 700));
      }

      pushLog("success", "Run completed successfully.");
      setRunStatus("success");
      setCurrentStep(null);
      setCurrentStepId(null);
      setTimeout(() => setRunStatus("idle"), 1200);
    } catch (e: any) {
      pushLog("error", e?.message || "Run failed.");
      setRunStatus("error");
      setCurrentStep(null);
      setCurrentStepId(null);
    }
  }

  function onConnect(params: Edge | Connection) {
    setEdges((eds) => addEdge({ ...params, animated: true }, eds));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/x-xconnect-node");
    if (!raw) return;

    try {
      const tpl = JSON.parse(raw);
      if (!tpl?.data?.title) return;

      const bounds = (e.target as HTMLElement)?.getBoundingClientRect?.();
      const x = e.clientX - (bounds?.left ?? 0);
      const y = e.clientY - (bounds?.top ?? 0);

      const position =
        rfRef.current?.screenToFlowPosition?.({ x: e.clientX, y: e.clientY }) ??
        // fallback: approximate using local coords
        { x, y };

      const node: Node<WorkflowNodeData> = {
        id: uid(),
        type: "basic",
        position,
        data: { ...tpl.data },
      };

      setNodes((ns) => ns.concat(node as any));
      selectNode(node.id);
    } catch {
      // ignore bad drag payload
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function exportJson() {
    const payload = { ...workflow, viewport: storeViewport };
    navigator.clipboard
      ?.writeText(JSON.stringify(payload, null, 2))
      .then(() => setToast("Copied workflow JSON to clipboard."))
      .catch(() => setToast("Couldn’t copy. Your browser chose drama."));
    setTimeout(() => setToast(null), 2500);
  }

  function downloadDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function renderCanvasToPng(): Promise<{ dataUrl: string; width: number; height: number }> {
    const viewportEl = rfWrapperRef.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!viewportEl) throw new Error("Canvas is not ready yet.");

    const bounds = getNodesBounds(nodes);
    const width = Math.max(1200, Math.ceil(bounds.width + 260));
    const height = Math.max(720, Math.ceil(bounds.height + 260));
    const viewport = getViewportForBounds(bounds, width, height, 0.5, 2);

    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    const backgroundColor = bg ? `rgb(${bg})` : "#ffffff";

    const dataUrl = await toPng(viewportEl, {
      backgroundColor,
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });

    return { dataUrl, width, height };
  }

  async function exportPng() {
    setExportMenuOpen(false);
    setExporting(true);
    try {
      const { dataUrl } = await renderCanvasToPng();
      const name = (workflow.name || "workflow").replace(/\s+/g, "_");
      downloadDataUrl(dataUrl, `${name}.png`);
      setToast("Exported PNG.");
    } catch (e: any) {
      setToast(e?.message ? `Export failed: ${e.message}` : "Export failed.");
    } finally {
      setExporting(false);
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function exportPdf() {
    setExportMenuOpen(false);
    setExporting(true);
    try {
      const { dataUrl, width, height } = await renderCanvasToPng();
      const orientation = width >= height ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "px", format: [width, height] });
      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      const name = (workflow.name || "workflow").replace(/\s+/g, "_");
      pdf.save(`${name}.pdf`);
      setToast("Exported PDF.");
    } catch (e: any) {
      setToast(e?.message ? `Export failed: ${e.message}` : "Export failed.");
    } finally {
      setExporting(false);
      setTimeout(() => setToast(null), 2500);
    }
  }


  function resetCanvas() {
    if (!confirm("Reset the canvas (nodes + edges)?")) return;
    reset();
    setToast("Canvas reset.");
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <Shell
      title="Studio"
      right={
        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={runWorkflow}
            title="Run workflow"
            disabled={exporting || runStatus === "running"}
          >
            {runStatus === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {runStatus === "running" ? "Running..." : "Run"}
          </button>

          <div className="relative" data-export-menu>
            <button
              className="btn btn-primary"
              onClick={() => setExportMenuOpen((v) => !v)}
              title="Export workflow as image"
              disabled={exporting}
            >
              <Download className="w-4 h-4" /> Export
            </button>

            {exportMenuOpen ? (
              <div className="absolute right-0 mt-2 w-44 rounded-xl2 border border-border bg-panel shadow-soft p-2">
                <button className="btn w-full justify-start" onClick={exportPng} disabled={exporting}>
                  <ImageDown className="w-4 h-4" /> PNG
                </button>
                <button className="btn w-full justify-start mt-1" onClick={exportPdf} disabled={exporting}>
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <div className="h-px bg-border my-2" />
                <button className="btn w-full justify-start" onClick={exportJson} disabled={exporting}>
                  <Download className="w-4 h-4" /> Copy JSON
                </button>
              </div>
            ) : null}
          </div>

          <button
            className="btn"
            onClick={() => setInspectorOpen(true)}
            title="Inspector"
            disabled={!selectedNodeId}
          >
            <SlidersHorizontal className="w-4 h-4" /> Inspector
          </button>

          <button className="btn btn-danger" onClick={resetCanvas} title="Reset canvas" disabled={exporting}>
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      } >
      {toast ? <Toast text={toast} onClose={() => setToast(null)} /> : null}

      <Modal
        open={inspectorOpen}
        title="Inspector"
        subtitle="Edit selected node settings."
        canClose={!exporting}
        onClose={() => {
          setInspectorOpen(false);
          selectNode(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setInspectorOpen(false);
                selectNode(null);
              }}
            >
              Done
            </button>
          </div>
        }
      >
        <Inspector />
      </Modal>


      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8">
          <Card
            title={
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={onNameBlur}
                className="w-full rounded-xl2 bg-panel2 border border-border px-3 py-2 text-sm outline-none focus:border-lavender/60"
                placeholder="Workflow name"
              />
            }
            subtitle="Drag nodes in, wire them up, and pretend this is all effortless."
          >
            <div ref={rfWrapperRef} className="h-[70vh] rounded-xl2 border border-border bg-panel/30 overflow-hidden">
              <ErrorBoundary>
                <ReactFlowProvider>
                  <ReactFlow
                    className={runStatus === "running" ? "flow-run" : ""}
                    nodes={decoratedNodes}
                    edges={decoratedEdges}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    connectionLineStyle={connectionLineStyle}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={(inst) => (rfRef.current = inst)}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={(_, n) => { selectNode(n.id); setInspectorOpen(true); }}
                    onPaneClick={() => { selectNode(null); setInspectorOpen(false); }}
                    defaultViewport={storeViewport as Viewport}
                    onMoveEnd={(_, vp) => setViewport(vp as Viewport)}
                    fitView={nodes.length === 0}
                  >
                    <MiniMap pannable zoomable />
                    <Controls />
                    <Background gap={18} size={1} />
                  </ReactFlow>
                </ReactFlowProvider>
              </ErrorBoundary>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          <Card title="Nodes" subtitle="Drag into the canvas.">
            <NodePalette />
          </Card>

          <Card
            title="Flow steps"
            subtitle="Plain-language checklist anyone can follow."
          >
            <ol className="space-y-2 text-sm">
              {nodes.length === 0 ? (
                <li className="text-muted">Add nodes to build the flow.</li>
              ) : (
                nodes.map((n, i) => {
                  const isActive = n.id === currentStepId;
                  return (
                    <li
                      key={n.id}
                      className={[
                        "flex items-center gap-2 p-2 rounded-xl2 border transition",
                        isActive ? "border-lavender/60 bg-panel2" : "border-border bg-panel/60",
                      ].join(" ")}
                    >
                      <span className="chip !px-2 !py-1 !text-xs">Step {i + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-text">{n.data?.title || n.id}</span>
                        <span className="text-xs text-muted">
                          {n.data?.provider ? `${n.data.provider} • ` : ""}{n.data?.op || "Action"}
                        </span>
                      </div>
                      {isActive ? <Loader2 className="w-4 h-4 animate-spin text-lavender ml-auto" /> : null}
                    </li>
                  );
                })
              )}
            </ol>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                {runStatus === "running" ? <Loader2 className="w-4 h-4 animate-spin text-lavender" /> : null}
                {runStatus === "success" ? <CheckCircle2 className="w-4 h-4 text-mint" /> : null}
                {runStatus === "error" ? <AlertTriangle className="w-4 h-4 text-danger" /> : null}
                <span>Run details</span>
                <span className="chip !text-xs !px-2">{runStatus.toUpperCase()}</span>
              </div>
            }
            subtitle={currentStep ? `Working on: ${currentStep}` : runStatus === "success" ? "Completed" : "Run to see logs."}
          >
            <div className="progress-bar">
              <div
                className="h-full bg-gradient-to-r from-lavender/60 via-mint/70 to-peach/70 transition-all duration-300"
                style={{ width: `${runProgress}%` }}
              />
            </div>

            <div className="mt-3 h-48 rounded-xl2 border border-border bg-panel2 px-3 py-2 overflow-y-auto text-xs font-mono space-y-2">
              {runLogs.length === 0 ? (
                <div className="text-muted">No logs yet. Click Run to simulate the workflow.</div>
              ) : (
                runLogs.map((l, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-muted">{new Date(l.ts).toLocaleTimeString()}</span>
                    <span
                      className={
                        l.level === "error"
                          ? "text-danger"
                          : l.level === "success"
                          ? "text-mint"
                          : "text-text"
                      }
                    >
                      {l.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
