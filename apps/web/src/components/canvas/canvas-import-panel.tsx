"use client";

import { useEffect, useState } from "react";
import type { Node } from "@xyflow/react";
import { apiFetch } from "@/lib/api";

type CanvasImportPanelProps = {
  workspaceId: string;
  onImport: (node: Node) => void;
};

type DocumentItem = {
  id: string;
  title: string;
};

type SourceItem = {
  id: string;
  title: string;
  url: string;
};

export default function CanvasImportPanel({
  workspaceId,
  onImport,
}: CanvasImportPanelProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadItems() {
      const [documentsResponse, sourcesResponse] = await Promise.all([
        apiFetch(`/workspaces/${workspaceId}/documents`),
        apiFetch(`/workspaces/${workspaceId}/sources`),
      ]);

      if (documentsResponse.ok) {
        const data = await documentsResponse.json();
        setDocuments(data.documents);
      }

      if (sourcesResponse.ok) {
        const data = await sourcesResponse.json();
        setSources(data.sources);
      }
    }

    void loadItems();
  }, [workspaceId]);

  function importDocument(document: DocumentItem) {
    onImport({
      id: `document-${document.id}`,
      type: "research",
      position: { x: 350, y: 250 },
      data: {
        title: document.title,
        description: "Imported document",
        category: "document",
        entityId: document.id,
      },
    });

    setOpen(false);
  }

  function importSource(source: SourceItem) {
    onImport({
      id: `source-${source.id}`,
      type: "research",
      position: { x: 350, y: 250 },
      data: {
        title: source.title,
        description: source.url,
        category: "source",
        entityId: source.id,
      },
    });

    setOpen(false);
  }

  return (
    <div className="absolute right-5 top-20 z-20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-md transition hover:bg-slate-50"
      >
        {open ? "Close import" : "Import existing"}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 max-h-[calc(100vh-12rem)] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
          <section>
            <h3 className="text-sm font-semibold text-slate-900">Documents</h3>

            <div className="mt-3 space-y-1">
              {documents.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">
                  No documents found.
                </p>
              ) : (
                documents.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => importDocument(document)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    {document.title}
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Sources</h3>

            <div className="mt-3 space-y-1">
              {sources.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">
                  No sources found.
                </p>
              ) : (
                sources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => importSource(source)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="block font-medium">{source.title}</span>

                    <span className="mt-1 block truncate text-xs text-slate-400">
                      {source.url}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
