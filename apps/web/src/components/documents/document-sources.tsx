"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Source = {
  id: string;
  title: string;
  url: string;
  description?: string | null;
};

type Props = {
  documentId: string;
  workspaceId: string;
};

export function DocumentSources({ documentId, workspaceId }: Props) {
  const [sources, setSources] = useState<Source[]>([]);
  const [available, setAvailable] = useState<Source[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSources() {
    const [linkedResponse, availableResponse] = await Promise.all([
      apiFetch(`/documents/${documentId}/sources`),
      apiFetch(`/workspaces/${workspaceId}/sources`),
    ]);

    const linkedData = await linkedResponse.json();
    const availableData = await availableResponse.json();

    setSources(linkedData.sources ?? []);
    setAvailable(availableData.sources ?? []);
  }

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        await loadSources();
      } catch {
        if (!cancelled) {
          setError("Unable to load sources.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void initialize();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [documentId, workspaceId]);

  async function linkSource() {
    if (!selectedId) return;

    try {
      await apiFetch(`/documents/${documentId}/sources/${selectedId}`, {
        method: "POST",
      });

      setSelectedId("");
      await loadSources();
    } catch {
      setError("Unable to link source.");
    }
  }

  async function unlinkSource(sourceId: string) {
    try {
      await apiFetch(`/documents/${documentId}/sources/${sourceId}`, {
        method: "DELETE",
      });

      await loadSources();
    } catch {
      setError("Unable to unlink source.");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading sources...</p>;
  }

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="font-semibold">Research sources</h2>
        <p className="text-sm text-muted-foreground">
          Sources connected to this document.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select a source</option>

          {available
            .filter(
              (source) => !sources.some((linked) => linked.id === source.id),
            )
            .map((source) => (
              <option key={source.id} value={source.id}>
                {source.title}
              </option>
            ))}
        </select>

        <button
          type="button"
          disabled={!selectedId}
          onClick={() => void linkSource()}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          Link
        </button>
      </div>

      <div className="space-y-2">
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sources linked yet.
          </p>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm underline"
              >
                {source.title}
              </a>

              <button
                type="button"
                onClick={() => void unlinkSource(source.id)}
                className="shrink-0 text-sm text-red-600"
              >
                Unlink
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
