"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import ResearchSourcesPanel from "@/components/research-sources/research-sources-panel";
import WorkspaceMembers from "@/components/workspace/workspace-members";

type WorkspaceDetailProps = {
  workspaceId: string;
};

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  memberships?: {
    role: string;
  }[];
};

type DocumentItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function WorkspaceDetail({ workspaceId }: WorkspaceDetailProps) {
  const router = useRouter();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadWorkspace() {
    const response = await apiFetch(`/workspaces/${workspaceId}`);

    if (!response.ok) {
      throw new Error("Unable to load workspace");
    }

    const data = await response.json();
    setWorkspace(data.workspace);
  }

  async function loadDocuments() {
    const response = await apiFetch(`/workspaces/${workspaceId}/documents`);

    if (!response.ok) {
      throw new Error("Unable to load documents");
    }

    const data = await response.json();
    setDocuments(data.documents);
  }

  useEffect(() => {
    async function load() {
      try {
        await Promise.all([loadWorkspace(), loadDocuments()]);
      } catch {
        setError("Unable to load workspace data");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [workspaceId]);

  async function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) return;

    setCreating(true);
    setError("");

    try {
      const response = await apiFetch(`/workspaces/${workspaceId}/documents`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          content: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create document");
      }

      const data = await response.json();

      setTitle("");
      router.push(`/dashboard/${workspaceId}/documents/${data.document.id}`);
    } catch {
      setError("Unable to create document");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <section className="p-8 text-slate-400">Loading workspace...</section>
    );
  }

  if (!workspace) {
    return (
      <section className="p-8 text-red-400">
        {error || "Workspace not found"}
      </section>
    );
  }

  return (
    <section className="p-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to workspaces
        </button>

        <h1 className="text-3xl font-bold">{workspace.name}</h1>

        {workspace.description && (
          <p className="mt-2 text-slate-400">{workspace.description}</p>
        )}

        <WorkspaceMembers
          workspaceId={workspaceId}
          currentRole={workspace.memberships?.[0]?.role}
        />

        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Create document</h2>

          <form onSubmit={handleCreateDocument} className="mt-4 flex gap-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Document title"
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              maxLength={200}
              required
            />

            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Documents</h2>

          {documents.length === 0 ? (
            <p className="mt-4 text-slate-400">No documents yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {documents.map((document) => (
                <button
                  key={document.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/${workspaceId}/documents/${document.id}`,
                    )
                  }
                  className="block w-full rounded-lg border border-slate-800 bg-slate-900 p-4 text-left hover:border-slate-600"
                >
                  <p className="font-medium">{document.title}</p>

                  <p className="mt-1 text-xs text-slate-500">
                    Updated {new Date(document.updatedAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}
        <ResearchSourcesPanel workspaceId={workspaceId} />
      </div>
    </section>
  );
}
