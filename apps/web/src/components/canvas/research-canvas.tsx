"use client";

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
import ResearchNode from "./nodes/research-node";

const nodeTypes = {
  research: ResearchNode,
};

const initialNodes: Node[] = [
  {
    id: "research-1",
    type: "research",
    position: { x: 180, y: 120 },
    data: {
      title: "Research Source",
      description: "A source for your investigation.",
      category: "source",
    },
  },
  {
    id: "document-1",
    type: "research",
    position: { x: 520, y: 280 },
    data: {
      title: "Research Document",
      description: "Organize your findings here.",
      category: "document",
    },
  },
];

const initialEdges: Edge[] = [];

function CanvasContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  function handleConnect(connection: Connection) {
    setEdges((currentEdges) => addEdge(connection, currentEdges));
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

    setNodes((currentNodes) => [...currentNodes, newNode]);
  }

  function deleteSelectedNodes() {
    const selectedNodeIds = new Set(
      nodes.filter((node) => node.selected).map((node) => node.id),
    );

    if (selectedNodeIds.size === 0) return;

    setNodes((currentNodes) =>
      currentNodes.filter((node) => !selectedNodeIds.has(node.id)),
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          !selectedNodeIds.has(edge.source) &&
          !selectedNodeIds.has(edge.target),
      ),
    );
  }

  const selectedNodeCount = nodes.filter((node) => node.selected).length;

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden rounded-xl border bg-slate-50">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <button
          type="button"
          className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200"
          onClick={() => addResearchNode("source")}
        >
          + Source
        </button>

        <button
          type="button"
          className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-900 hover:bg-purple-200"
          onClick={() => addResearchNode("document")}
        >
          + Document
        </button>

        <button
          type="button"
          className="rounded-lg bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-200"
          onClick={() => addResearchNode("note")}
        >
          + Note
        </button>

        <button
          type="button"
          className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-900 hover:bg-green-200"
          onClick={() => addResearchNode("question")}
        >
          + Question
        </button>

        <button
          type="button"
          disabled={selectedNodeCount === 0}
          className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={deleteSelectedNodes}
        >
          Delete selected
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 shadow">
        {selectedNodeCount} selected
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
  );
}

export default function ResearchCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
