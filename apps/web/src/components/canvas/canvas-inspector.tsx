"use client";

import type { Edge, Node } from "@xyflow/react";

type CanvasInspectorProps = {
  node: Node | undefined;
  edge: Edge | undefined;
  onUpdateNode: (updates: {
    title?: string;
    description?: string;
    category?: "source" | "document" | "note" | "question";
  }) => void;
  onUpdateEdge: (updates: { label?: string }) => void;
};

type NodeData = {
  title?: string;
  description?: string;
  category?: "source" | "document" | "note" | "question";
};

export default function CanvasInspector({
  node,
  edge,
  onUpdateNode,
  onUpdateEdge,
}: CanvasInspectorProps) {
  const data = (node?.data ?? {}) as NodeData;

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white text-slate-900">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold">Inspector</h2>
        <p className="mt-1 text-xs text-slate-500">Edit the selected item</p>
      </div>

      {!node && !edge ? (
        <div className="px-5 py-6 text-sm text-slate-500">
          Select a node or connection to edit its properties.
        </div>
      ) : edge ? (
        <div className="space-y-5 px-5 py-5">
          <div>
            <label
              htmlFor="edge-label"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Relationship
            </label>

            <input
              id="edge-label"
              type="text"
              value={typeof edge.label === "string" ? edge.label : ""}
              onChange={(event) => onUpdateEdge({ label: event.target.value })}
              placeholder="e.g. supports, contradicts"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Connection
            </p>
            <p className="mt-2 break-all text-xs text-slate-500">
              {edge.source} → {edge.target}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <label
              htmlFor="node-title"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Title
            </label>

            <input
              id="node-title"
              type="text"
              value={data.title ?? ""}
              onChange={(event) => onUpdateNode({ title: event.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="node-description"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Description
            </label>

            <textarea
              id="node-description"
              value={data.description ?? ""}
              onChange={(event) =>
                onUpdateNode({ description: event.target.value })
              }
              rows={5}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="node-category"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Category
            </label>

            <select
              id="node-category"
              value={data.category ?? "note"}
              onChange={(event) =>
                onUpdateNode({
                  category: event.target.value as NodeData["category"],
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="source">Source</option>
              <option value="document">Document</option>
              <option value="note">Note</option>
              <option value="question">Question</option>
            </select>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Node ID
            </p>
            <p className="mt-2 break-all text-xs text-slate-500">{node?.id}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
