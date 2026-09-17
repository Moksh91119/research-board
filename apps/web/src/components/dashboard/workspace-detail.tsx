"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  memberships: { role: string }[];
};

export function WorkspaceDetail() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      try {
        const response = await apiFetch(`/workspaces/${params.workspaceId}`);

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Workspace not found.");
        }

        const data = await response.json();

        if (!cancelled) {
          setWorkspace(data.workspace);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load workspace.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [params.workspaceId, router]);

  if (loading) {
    return <main className="p-8">Loading workspace...</main>;
  }

  if (error || !workspace) {
    return (
      <main className="p-8">
        <p className="text-red-400">{error || "Workspace not found."}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-400">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ? All workspaces
        </Link>

        <header className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold">{workspace.name}</h1>

            <span className="rounded-full bg-blue-950 px-3 py-1 text-xs text-blue-300">
              {workspace.memberships[0]?.role ?? "MEMBER"}
            </span>
          </div>

          <p className="mt-3 text-slate-400">
            {workspace.description || "No description"}
          </p>
        </header>

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Research canvas</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your research documents, sources, and knowledge graph will appear
            here.
          </p>
        </section>
      </div>
    </main>
  );
}
