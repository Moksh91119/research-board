"use client";

import type { Edge, Node } from "@xyflow/react";

type NodeUpdates = {
  title?: string;
  description?: string;
  category?: string;
};

type EdgeUpdates = {
  label?: string;
};

type CanvasInspectorProps = {
  node: Node | undefined;
  edge: Edge | undefined;
  onUpdateNode: (updates: NodeUpdates) => void;
  onUpdateEdge: (updates: EdgeUpdates) => void;
  onDeleteNode: () => void;
  onDeleteEdge: () => void;
};

export function CanvasInspector({
  node,
  edge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
}: CanvasInspectorProps) {
  if (!node && !edge) {
    return (
      <aside className="w-80 shrink-0 border-l bg-background p-4">
        <p className="text-sm text-muted-foreground">
          Select a node or connection to inspect it.
        </p>
      </aside>
    );
  }

  if (edge) {
    return (
      <aside className="w-80 shrink-0 space-y-4 border-l bg-background p-4">
        <div>
          <h2 className="font-semibold">Connection</h2>
          <p className="text-xs text-muted-foreground">
            {edge.source} → {edge.target}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="edge-label" className="text-sm font-medium">
            Label
          </label>

          <input
            id="edge-label"
            value={typeof edge.label === "string" ? edge.label : ""}
            onChange={(event) =>
              onUpdateEdge({ label: event.target.value })
            }
            placeholder="e.g. supports, contradicts"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={onDeleteEdge}
          className="w-full rounded-md border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          Delete connection
        </button>
      </aside>
    );
  }

  if (!node) return null;

  const data = node.data as {
    title?: string;
    description?: string;
    category?: string;
  };

  return (
    <aside className="w-80 shrink-0 space-y-4 border-l bg-background p-4">
      <div>
        <h2 className="font-semibold">Node inspector</h2>
        <p className="text-xs text-muted-foreground">{node.id}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="node-title" className="text-sm font-medium">
          Title
        </label>

        <input
          id="node-title"
          value={data.title ?? ""}
          onChange={(event) =>
            onUpdateNode({ title: event.target.value })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="node-description" className="text-sm font-medium">
          Description
        </label>

        <textarea
          id="node-description"
          value={data.description ?? ""}
          onChange={(event) =>
            onUpdateNode({ description: event.target.value })
          }
          rows={5}
          className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="node-category" className="text-sm font-medium">
          Category
        </label>

        <select
          id="node-category"
          value={data.category ?? "idea"}
          onChange={(event) =>
            onUpdateNode({ category: event.target.value })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="idea">Idea</option>
          <option value="question">Question</option>
          <option value="evidence">Evidence</option>
          <option value="claim">Claim</option>
          <option value="source">Source</option>
          <option value="document">Document</option>
          <option value="task">Task</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onDeleteNode}
        className="w-full rounded-md border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
      >
        Delete node
      </button>
    </aside>
  );
}