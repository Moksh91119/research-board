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

function CanvasContent({ workspaceId }: ResearchCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );

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
      onNodesChange(changes);

      setNodes((currentNodes) => {
        saveCanvas(currentNodes, edges);
        return currentNodes;
      });
    },
    [edges, onNodesChange, saveCanvas, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);

      setEdges((currentEdges) => {
        saveCanvas(nodes, currentEdges);
        return currentEdges;
      });
    },
    [nodes, onEdgesChange, saveCanvas, setEdges],
  );

  function handleConnect(connection: Connection) {
    setEdges((currentEdges) => {
      const updatedEdges = addEdge(connection, currentEdges);

      saveCanvas(nodes, updatedEdges);
      return updatedEdges;
    });
  }

  function addResearchNode(
    category: "source" | "document" | "note" | "question",
  ) {
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

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center rounded-xl border">
        Loading canvas...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 w-full overflow-hidden rounded-xl border bg-slate-50">
      <div className="relative min-h-0 min-w-0 flex-1">
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
