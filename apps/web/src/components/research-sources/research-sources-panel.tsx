"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type ResearchSourcesPanelProps = {
  workspaceId: string;
};

type ResearchSource = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
};

type Metadata = {
  title: string | null;
  description: string | null;
  image: string | null;
};

export default function ResearchSourcesPanel({
  workspaceId,
}: ResearchSourcesPanelProps) {
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSources() {
    const response = await apiFetch(`/workspaces/${workspaceId}/sources`);

    if (!response.ok) {
      throw new Error("Unable to load sources");
    }

    const data = await response.json();
    setSources(data.sources);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiFetch(`/workspaces/${workspaceId}/sources`);

        if (!response.ok) {
          throw new Error("Unable to load sources");
        }

        const data = await response.json();

        if (!cancelled) {
          setSources(data.sources);
        }
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

    void load();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  async function handlePreview() {
    if (!url.trim()) {
      setError("Enter a URL first");
      return;
    }

    setPreviewing(true);
    setError("");

    try {
      const response = await apiFetch("/metadata/preview", {
        method: "POST",
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to preview metadata");
      }

      const data = await response.json();
      const metadata = data.metadata as Metadata;

      setPreview(metadata);

      if (!title.trim() && metadata.title) {
        setTitle(metadata.title);
      }

      if (!description.trim() && metadata.description) {
        setDescription(metadata.description);
      }
    } catch {
      setError("Unable to fetch metadata. Check the URL.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const response = await apiFetch(`/workspaces/${workspaceId}/sources`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create source");
      }

      setTitle("");
      setUrl("");
      setDescription("");
      setPreview(null);

      await loadSources();
    } catch {
      setError("Unable to create source. Check the form.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(sourceId: string) {
    if (!window.confirm("Delete this source?")) return;

    const response = await apiFetch(`/sources/${sourceId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Unable to delete source");
      return;
    }

    setSources((current) => current.filter((source) => source.id !== sourceId));
  }

  async function handleRefresh(sourceId: string) {
    setError(null);

    try {
      const response = await apiFetch(`/sources/${sourceId}/metadata/refresh`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh metadata");
      }

      await loadSources();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh metadata",
      );
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Research sources</h2>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Source title"
          maxLength={200}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
        />

        <input
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setPreview(null);
          }}
          type="url"
          placeholder="https://example.com/article"
          maxLength={2_000}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
        />

        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing || !url.trim()}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {previewing ? "Fetching..." : "Preview metadata"}
        </button>

        {preview && (
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Metadata preview
            </p>

            {preview.title && (
              <p className="mt-2 font-medium">{preview.title}</p>
            )}

            {preview.description && (
              <p className="mt-1 text-sm text-slate-400">
                {preview.description}
              </p>
            )}

            {preview.image && (
              <img
                src={preview.image}
                alt=""
                className="mt-3 max-h-48 rounded-lg object-cover"
              />
            )}
          </div>
        )}

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional description"
          maxLength={1_000}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add source"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-slate-400">Loading sources...</p>
        ) : sources.length === 0 ? (
          <p className="text-sm text-slate-400">No research sources yet.</p>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <article
                key={source.id}
                className="rounded-lg border border-slate-800 bg-slate-950 p-4"
              >
                {source.imageUrl && (
                  <img
                    src={source.imageUrl}
                    alt=""
                    loading="lazy"
                    className="mb-4 max-h-48 w-full rounded-lg object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium">{source.title}</h3>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-sm text-blue-400 hover:text-blue-300"
                    >
                      {source.url}
                    </a>

                    {source.description && (
                      <p className="mt-2 text-sm text-slate-400">
                        {source.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRefresh(source.id)}
                    className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
                  >
                    Refresh Metadata
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(source.id)}
                    className="shrink-0 text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
