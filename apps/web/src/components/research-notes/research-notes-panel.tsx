"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Source = {
  id: string;
  title: string;
  url: string;
};

type Note = {
  id: string;
  content: string;
  quote: string | null;
  locator: string | null;
  source: Source | null;
  createdBy: {
    email: string;
  };
};

type Props = {
  documentId: string;
  workspaceId: string;
};

export default function ResearchNotesPanel({ documentId, workspaceId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [content, setContent] = useState("");
  const [quote, setQuote] = useState("");
  const [locator, setLocator] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    const [notesResponse, sourcesResponse] = await Promise.all([
      apiFetch(`/documents/${documentId}/notes`),
      apiFetch(`/workspaces/${workspaceId}/sources`),
    ]);

    if (!notesResponse.ok || !sourcesResponse.ok) {
      throw new Error("Unable to load notes");
    }

    const notesData = await notesResponse.json();
    const sourcesData = await sourcesResponse.json();

    setNotes(notesData.notes);
    setSources(sourcesData.sources);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await loadData();
      } catch {
        if (!cancelled) setError("Unable to load research notes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [documentId, workspaceId]);

  async function handleCreate() {
    if (!content.trim() || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await apiFetch(`/documents/${documentId}/notes`, {
        method: "POST",
        body: JSON.stringify({
          content,
          quote: quote || undefined,
          locator: locator || undefined,
          sourceId: sourceId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create note");
      }

      setContent("");
      setQuote("");
      setLocator("");
      setSourceId("");
      await loadData();
    } catch {
      setError("Unable to create note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await apiFetch(`/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete note");
      }

      await loadData();
    } catch {
      setError("Unable to delete note");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-lg border border-slate-700 p-5">
        Loading research notes...
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-lg border border-slate-700 bg-slate-950 p-5">
      <h2 className="mb-4 text-lg font-semibold">Research notes</h2>

      {error && (
        <p className="mb-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a research note..."
          className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-blue-500"
        />

        <textarea
          value={quote}
          onChange={(event) => setQuote(event.target.value)}
          placeholder="Supporting quote (optional)"
          className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-blue-500"
        />

        <input
          value={locator}
          onChange={(event) => setLocator(event.target.value)}
          placeholder="Page, section, timestamp, etc. (optional)"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-blue-500"
        />

        <select
          value={sourceId}
          onChange={(event) => setSourceId(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-blue-500"
        >
          <option value="">No source selected</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!content.trim() || saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add note"}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-400">No research notes yet.</p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-lg border border-slate-700 p-4"
            >
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>

              {note.quote && (
                <blockquote className="mt-3 border-l-2 border-blue-500 pl-3 text-sm italic text-slate-300">
                  {note.quote}
                </blockquote>
              )}

              {note.locator && (
                <p className="mt-2 text-xs text-slate-400">
                  Location: {note.locator}
                </p>
              )}

              {note.source && (
                <a
                  href={note.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-xs text-blue-400 hover:underline"
                >
                  Source: {note.source.title}
                </a>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {note.createdBy.email}
                </span>

                <button
                  type="button"
                  onClick={() => void handleDelete(note.id)}
                  disabled={saving}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
