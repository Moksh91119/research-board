"use client";

type CanvasToolbarProps = {
  selectedNodeCount: number;
  onAddNode: (category: "source" | "document" | "note" | "question") => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
};

const buttonClass =
  "rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40";

export default function CanvasToolbar({
  selectedNodeCount,
  onAddNode,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onZoomIn,
  onZoomOut,
  onFitView,
}: CanvasToolbarProps) {
  return (
    <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
      <span className="px-2 text-xs font-semibold text-slate-500">Add</span>

      <button
        type="button"
        className={`${buttonClass} !bg-blue-100 !text-blue-800 hover:!bg-blue-200`}
        onClick={() => onAddNode("source")}
      >
        + Source
      </button>

      <button
        type="button"
        className={`${buttonClass} !bg-purple-100 !text-purple-800 hover:!bg-purple-200`}
        onClick={() => onAddNode("document")}
      >
        + Document
      </button>

      <button
        type="button"
        className={`${buttonClass} !bg-yellow-100 !text-yellow-800 hover:!bg-yellow-200`}
        onClick={() => onAddNode("note")}
      >
        + Note
      </button>

      <button
        type="button"
        className={`${buttonClass} !bg-green-100 !text-green-800 hover:!bg-green-200`}
        onClick={() => onAddNode("question")}
      >
        + Question
      </button>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <button type="button" className={buttonClass} onClick={onUndo}>
        ↶
      </button>

      <button type="button" className={buttonClass} onClick={onRedo}>
        ↷
      </button>

      <button
        type="button"
        className={buttonClass}
        disabled={selectedNodeCount === 0}
        onClick={onDuplicate}
      >
        Duplicate
      </button>

      <button
        type="button"
        className={`${buttonClass} !bg-red-100 !text-red-800 hover:!bg-red-200`}
        disabled={selectedNodeCount === 0}
        onClick={onDelete}
      >
        Delete
      </button>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <button type="button" className={buttonClass} onClick={onZoomOut}>
        −
      </button>

      <button type="button" className={buttonClass} onClick={onZoomIn}>
        +
      </button>

      <button type="button" className={buttonClass} onClick={onFitView}>
        Fit
      </button>

      <button type="button" className={buttonClass} onClick={onExport}>
        Export
      </button>

      <button
        type="button"
        className={`${buttonClass} !bg-red-100 !text-red-800 hover:!bg-red-200`}
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
