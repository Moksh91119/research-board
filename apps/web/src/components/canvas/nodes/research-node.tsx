"use client";

import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";

type ResearchNodeData = {
  title: string;
  description?: string;
  category?: "source" | "document" | "note" | "question";
};

const categoryStyles = {
  source: "border-blue-300 bg-blue-50",
  document: "border-purple-300 bg-purple-50",
  note: "border-yellow-300 bg-yellow-50",
  question: "border-green-300 bg-green-50",
};

export default function ResearchNode({ data, selected }: NodeProps) {
  const nodeData = data as ResearchNodeData;
  const category = nodeData.category ?? "note";

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={120}
        lineClassName="!border-transparent"
        handleClassName="h-2 w-2 rounded-sm border border-blue-500 bg-white"
      />

      <div
        className={`h-full min-h-32 w-full rounded-xl border-2 p-4 shadow-md ${categoryStyles[category]}`}
      >
        <Handle type="target" position={Position.Top} />

        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {category}
        </div>

        <h3 className="break-words text-lg font-semibold text-slate-900">
          {nodeData.title}
        </h3>

        {nodeData.description && (
          <p className="mt-2 break-words text-sm text-slate-600">
            {nodeData.description}
          </p>
        )}

        <Handle type="source" position={Position.Bottom} />
      </div>
    </>
  );
}
