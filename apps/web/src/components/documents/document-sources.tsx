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
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");

  async function loadSources() {
    const [linkedResponse, availableResponse] = await Promise.all([
      apiFetch(`/documents/${documentId}/sources`),
      apiFetch(`/workspaces/${workspaceId}/sources`),
    ]);

    if (!linkedResponse.ok || !availableResponse.ok) {
      throw new Error("Unable to load sources");
    }

    const linkedData = await linkedResponse.json();
    const availableData = await availableResponse.json();

    setSources(linkedData.sources ?? []);
    setAvailable(availableData.sources ?? []);
  }

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      async function initialize() {
        try {
          setError("");
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

      void initialize();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [documentId, workspaceId]);

  async function linkSource() {
    if (!selectedId || requesting) return;

    setRequesting(true);
    setError("");

    try {
      const response = await apiFetch(
        `/documents/${documentId}/sources/${selectedId}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Unable to link source");
      }

      setSelectedId("");
      await loadSources();
    } catch (linkError) {
      setError(
        linkError instanceof Error
          ? linkError.message
          : "Unable to link source.",
      );
    } finally {
      setRequesting(false);
    }
  }

  async function unlinkSource(sourceId: string) {
    if (requesting) return;

    setRequesting(true);
    setError("");

    try {
      const response = await apiFetch(
        `/documents/${documentId}/sources/${sourceId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Unable to unlink source");
      }

      await loadSources();
    } catch (unlinkError) {
      setError(
        unlinkError instanceof Error
          ? unlinkError.message
          : "Unable to unlink source.",
      );
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading sources...</p>;
  }

  const unlinkedSources = available.filter(
    (source) => !sources.some((linked) => linked.id === source.id),
  );

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="font-semibold">Research sources</h2>
        <p className="text-sm text-muted-foreground">
          Sources connected to this document.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <select
          value={selectedId}
          disabled={requesting}
          onChange={(event) => setSelectedId(event.target.value)}
          className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">Select a source</option>

          {unlinkedSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!selectedId || requesting}
          onClick={() => void linkSource()}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {requesting ? "Saving..." : "Link"}
        </button>
      </div>

      {unlinkedSources.length === 0 && sources.length > 0 && (
        <p className="text-sm text-muted-foreground">
          All workspace sources are already linked.
        </p>
      )}

      {available.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No workspace sources available.
        </p>
      )}

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
                disabled={requesting}
                onClick={() => void unlinkSource(source.id)}
                className="shrink-0 text-sm text-red-600 disabled:opacity-50"
              >
                {requesting ? "Saving..." : "Unlink"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
