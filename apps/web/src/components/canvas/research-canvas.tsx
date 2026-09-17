"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { apiFetch } from "@/lib/api";
import ResearchNode from "./nodes/research-node";
import CanvasInspector from "./canvas-inspector";

const nodeTypes = {
  research: ResearchNode,
};

type CanvasResponse = {
  nodes: Node[];
  edges: Edge[];
};

type ResearchCanvasProps = {
  workspaceId: string;
};

type CanvasSnapshot = {
  nodes: Node[];
  edges: Edge[];
};

function CanvasContent({ workspaceId }: ResearchCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );

  const historyRef = useRef<CanvasSnapshot[]>([]);
  const futureRef = useRef<CanvasSnapshot[]>([]);

  function recordHistory() {
    historyRef.current.push({
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    });

    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    }

    futureRef.current = [];
  }

  const loadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCanvas() {
      setLoading(true);

      try {
        const response = await apiFetch(`/workspaces/${workspaceId}/canvas`);

        if (!response.ok) {
          throw new Error("Failed to load canvas");
        }

        const data = (await response.json()) as CanvasResponse;

        if (cancelled) return;

        setNodes(data.nodes);
        setEdges(data.edges);
        loadedRef.current = true;
      } catch (error) {
        console.error(error);
        setSaveStatus("error");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCanvas();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, setNodes, setEdges]);

  const saveCanvas = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (!loadedRef.current) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");

        try {
          const response = await apiFetch(`/workspaces/${workspaceId}/canvas`, {
            method: "PUT",
            body: JSON.stringify({
              nodes: currentNodes.map((node) => ({
                id: node.id,
                type: node.type ?? "research",
                position: node.position,
                width: node.measured?.width,
                height: node.measured?.height,
                data: node.data,
              })),
              edges: currentEdges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
              })),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save canvas");
          }

          setSaveStatus("saved");
        } catch (error) {
          console.error(error);
          setSaveStatus("error");
        }
      }, 800);
    },
    [workspaceId],
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      recordHistory();
      const updatedNodes = applyNodeChanges(changes, nodes);

      setNodes(updatedNodes);
      saveCanvas(updatedNodes, edges);
    },
    [nodes, edges, saveCanvas, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      recordHistory();
      const updatedEdges = applyEdgeChanges(changes, edges);

      setEdges(updatedEdges);
      saveCanvas(nodes, updatedEdges);
    },
    [nodes, edges, saveCanvas, setEdges],
  );

  function handleConnect(connection: Connection) {
    setEdges((currentEdges) => {
      recordHistory();
      const updatedEdges = addEdge(connection, currentEdges);

      saveCanvas(nodes, updatedEdges);
      return updatedEdges;
    });
  }

  function addResearchNode(
    category: "source" | "document" | "note" | "question",
  ) {
    recordHistory();
    const titles = {
      source: "New Source",
      document: "New Document",
      note: "New Note",
      question: "New Question",
    };

    const newNode: Node = {
      id: `${category}-${crypto.randomUUID()}`,
      type: "research",
      position: {
        x: 300 + Math.random() * 200,
        y: 150 + Math.random() * 200,
      },
      data: {
        title: titles[category],
        description: "New research item.",
        category,
      },
    };

    setNodes((currentNodes) => {
      const updatedNodes = [...currentNodes, newNode];
      saveCanvas(updatedNodes, edges);
      return updatedNodes;
    });
  }

  function updateSelectedNode(updates: {
    title?: string;
    description?: string;
    category?: "source" | "document" | "note" | "question";
  }) {
    recordHistory();
    setNodes((currentNodes) => {
      const updatedNodes = currentNodes.map((node) => {
        if (!node.selected) return node;

        return {
          ...node,
          data: {
            ...node.data,
            ...updates,
          },
        };
      });

      saveCanvas(updatedNodes, edges);
      return updatedNodes;
    });
  }

  function deleteSelectedNodes() {
    recordHistory();
    const selectedIds = new Set(
      nodes.filter((node) => node.selected).map((node) => node.id),
    );

    if (selectedIds.size === 0) return;

    const updatedNodes = nodes.filter((node) => !selectedIds.has(node.id));

    const updatedEdges = edges.filter(
      (edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target),
    );

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    saveCanvas(updatedNodes, updatedEdges);
  }

  const selectedNodeCount = nodes.filter((node) => node.selected).length;

  const selectedNode = nodes.find((node) => node.selected);
  function duplicateSelectedNodes() {
    const selectedNodes = nodes.filter((node) => node.selected);

    if (selectedNodes.length === 0) return;

    const duplicatedNodes: Node[] = selectedNodes.map((node) => ({
      ...structuredClone(node),
      id: `${node.type ?? "node"}-${crypto.randomUUID()}`,
      position: {
        x: node.position.x + 40,
        y: node.position.y + 40,
      },
      selected: false,
    }));

    const updatedNodes = [
      ...nodes.map((node) => ({
        ...node,
        selected: false,
      })),
      ...duplicatedNodes,
    ];

    setNodes(updatedNodes);
    saveCanvas(updatedNodes, edges);
  }

  function clearCanvas() {
    if (nodes.length === 0) return;

    const confirmed = window.confirm(
      "Delete all canvas nodes and connections?",
    );

    if (!confirmed) return;

    setNodes([]);
    setEdges([]);
    saveCanvas([], []);
  }

  function handleCanvasKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();

      if (event.shiftKey) {
        redoCanvas();
      } else {
        undoCanvas();
      }

      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelectedNodes();
      return;
    }
    if (event.key === "Escape") {
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          selected: false,
        })),
      );

      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveCanvas(nodes, edges);
    }
  }

  function undoCanvas() {
    const previous = historyRef.current.pop();

    if (!previous) return;

    futureRef.current.push({
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    });

    setNodes(previous.nodes);
    setEdges(previous.edges);
    saveCanvas(previous.nodes, previous.edges);
  }

  function redoCanvas() {
    const next = futureRef.current.pop();

    if (!next) return;

    historyRef.current.push({
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    });

    setNodes(next.nodes);
    setEdges(next.edges);
    saveCanvas(next.nodes, next.edges);
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center rounded-xl border">
        Loading canvas...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 w-full overflow-hidden rounded-xl border bg-slate-50">
      <div
        className="relative min-h-0 min-w-0 flex-1 outline-none"
        tabIndex={0}
        onKeyDown={handleCanvasKeyDown}
      >
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <button
            type="button"
            className="rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-900"
            onClick={() => addResearchNode("source")}
          >
            + Source
          </button>

          <button
            type="button"
            className="rounded-lg bg-purple-100 px-3 py-2 text-sm text-purple-900"
            onClick={() => addResearchNode("document")}
          >
            + Document
          </button>

          <button
            type="button"
            className="rounded-lg bg-yellow-100 px-3 py-2 text-sm text-yellow-900"
            onClick={() => addResearchNode("note")}
          >
            + Note
          </button>

          <button
            type="button"
            className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-900"
            onClick={() => addResearchNode("question")}
          >
            + Question
          </button>

          <button
            type="button"
            disabled={selectedNodeCount === 0}
            className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-900 disabled:opacity-40"
            onClick={deleteSelectedNodes}
          >
            Delete selected
          </button>

          <button
            type="button"
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
            onClick={undoCanvas}
          >
            ↶ Undo
          </button>

          <button
            type="button"
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
            onClick={redoCanvas}
          >
            ↷ Redo
          </button>

          <button
            type="button"
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 disabled:opacity-40"
            disabled={selectedNodeCount === 0}
            onClick={duplicateSelectedNodes}
          >
            Duplicate
          </button>

          <button
            type="button"
            className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-900 hover:bg-red-200"
            onClick={clearCanvas}
          >
            Clear
          </button>
        </div>

        <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 shadow">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Save failed"}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnDrag={[1, 2]}
          multiSelectionKeyCode="Shift"
        >
          <Background gap={20} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <CanvasInspector node={selectedNode} onUpdate={updateSelectedNode} />
    </div>
  );
}

export default function ResearchCanvas(props: ResearchCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasContent {...props} />
    </ReactFlowProvider>
  );
}
