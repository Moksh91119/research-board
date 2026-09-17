"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type DocumentSourcesPanelProps = {
  documentId: string;
  workspaceId: string;
};

type Source = {
  id: string;
  title: string;
  url: string;
};

type LinkedSource = {
  source: Source;
};

export default function DocumentSourcesPanel({
  documentId,
  workspaceId,
}: DocumentSourcesPanelProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [linkedSources, setLinkedSources] = useState<LinkedSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSources() {
    const response = await apiFetch(`/workspaces/${workspaceId}/sources`);

    if (!response.ok) {
      throw new Error("Unable to load sources");
    }

    const data = await response.json();
    setSources(data.sources);
  }

  async function loadLinkedSources() {
    const response = await apiFetch(`/documents/${documentId}/sources`);

    if (!response.ok) {
      throw new Error("Unable to load linked sources");
    }

    const data = await response.json();
    setLinkedSources(data.sources);
  }

  async function load() {
    try {
      await Promise.all([loadSources(), loadLinkedSources()]);
    } catch {
      setError("Unable to load sources");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const [sourcesResponse, linkedResponse] = await Promise.all([
          apiFetch(`/workspaces/${workspaceId}/sources`),
          apiFetch(`/documents/${documentId}/sources`),
        ]);

        if (!sourcesResponse.ok || !linkedResponse.ok) {
          throw new Error("Unable to load sources");
        }

        const sourcesData = await sourcesResponse.json();
        const linkedData = await linkedResponse.json();

        if (cancelled) return;

        setSources(sourcesData.sources);
        setLinkedSources(linkedData.sources);
      } catch {
        if (!cancelled) {
          setError("Unable to load sources");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [documentId, workspaceId]);
  async function handleLink() {
    if (!selectedSourceId) return;

    const response = await apiFetch(
      `/documents/${documentId}/sources/${selectedSourceId}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      setError("Unable to link source");
      return;
    }

    setSelectedSourceId("");
    await loadLinkedSources();
  }

  async function handleUnlink(sourceId: string) {
    const response = await apiFetch(
      `/documents/${documentId}/sources/${sourceId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      setError("Unable to unlink source");
      return;
    }

    setLinkedSources((current) =>
      current.filter((item) => item.source.id !== sourceId),
    );
  }

  const linkedIds = new Set(linkedSources.map((item) => item.source.id));

  const availableSources = sources.filter(
    (source) => !linkedIds.has(source.id),
  );

  if (loading) {
    return (
      <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">Loading linked sources...</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Linked sources</h2>

      <div className="mt-4 flex gap-3">
        <select
          value={selectedSourceId}
          onChange={(event) => setSelectedSourceId(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Select a source</option>

          {availableSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleLink}
          disabled={!selectedSourceId}
          className="rounded-lg bg-blue-600 px-4 py-3 text-sm hover:bg-blue-500 disabled:opacity-50"
        >
          Link
        </button>
      </div>

      {linkedSources.length === 0 ? (
        <p className="mt-5 text-sm text-slate-400">
          No sources linked to this document.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {linkedSources.map(({ source }) => (
            <div
              key={source.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
            >
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 break-all text-sm text-blue-400 hover:text-blue-300"
              >
                {source.title}
              </a>

              <button
                type="button"
                onClick={() => handleUnlink(source.id)}
                className="shrink-0 text-sm text-red-400 hover:text-red-300"
              >
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </section>
  );
}
