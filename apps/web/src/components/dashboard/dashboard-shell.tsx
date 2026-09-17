"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type User = {
  id: string;
  email: string;
};

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  memberships: { role: string }[];
};

export function DashboardShell() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadWorkspaces() {
    const response = await apiFetch("/workspaces");

    if (!response.ok) {
      throw new Error("Unable to load workspaces.");
    }

    const data = await response.json();
    setWorkspaces(data.workspaces);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await apiFetch("/auth/me");

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setUser(data.user);
          await loadWorkspaces();
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load your session.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await apiFetch("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error("Workspace creation failed.");
      }

      setName("");
      setDescription("");
      await loadWorkspaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="p-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-slate-400">Workspace dashboard</p>

          <h2 className="mt-2 text-3xl font-semibold">Your research</h2>

          <form
            onSubmit={handleCreate}
            className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-lg font-medium">Create workspace</h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                required
                placeholder="Workspace name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                placeholder="Description (optional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              disabled={submitting}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              Create workspace
            </button>
          </form>

          {error && (
            <p className="mt-5 rounded-lg bg-red-950 p-4 text-red-300">
              {error}
            </p>
          )}

          <h3 className="mt-8 text-xl font-semibold">Your workspaces</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/dashboard/${workspace.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-lg font-semibold">{workspace.name}</h4>

                  <span className="rounded-full bg-blue-950 px-3 py-1 text-xs text-blue-300">
                    {workspace.memberships[0]?.role ?? "MEMBER"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  {workspace.description || "No description"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
