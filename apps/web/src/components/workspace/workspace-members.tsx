"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Member = {
  id: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  user: {
    id: string;
    email: string;
  };
};

type Props = {
  workspaceId: string;
  currentRole?: string;
};

export default function WorkspaceMembers({ workspaceId, currentRole }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = currentRole === "OWNER";

  async function loadMembers() {
    const response = await apiFetch(`/workspaces/${workspaceId}/members`);

    if (!response.ok) {
      throw new Error("Unable to load members.");
    }

    const data = await response.json();
    setMembers(data.members);
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) return;

      return loadMembers()
        .catch(() => {
          if (!cancelled) {
            setError("Unable to load members.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await apiFetch(`/workspaces/${workspaceId}/members`, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Unable to invite member.");
      }

      setEmail("");
      await loadMembers();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(memberId: string, nextRole: string) {
    const response = await apiFetch(
      `/workspaces/${workspaceId}/members/${memberId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      },
    );

    if (!response.ok) {
      setError("Unable to update member role.");
      return;
    }

    await loadMembers();
  }

  async function removeMember(memberId: string) {
    const confirmed = window.confirm("Remove this member?");
    if (!confirmed) return;

    const response = await apiFetch(
      `/workspaces/${workspaceId}/members/${memberId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      setError("Unable to remove member.");
      return;
    }

    await loadMembers();
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Workspace members</h2>

      {isOwner && (
        <form
          onSubmit={handleInvite}
          className="mt-5 grid gap-3 md:grid-cols-[1fr_150px_auto]"
        >
          <input
            required
            type="email"
            placeholder="Member email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />

          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "EDITOR" | "VIEWER")
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>

          <button
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 disabled:opacity-50"
          >
            Invite
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-slate-400">Loading members...</p>
      ) : (
        <div className="mt-5 space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 p-3"
            >
              <div>
                <p className="text-sm font-medium">{member.user.email}</p>
                <p className="text-xs text-slate-500">{member.role}</p>
              </div>

              {isOwner && member.role !== "OWNER" && (
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(event) =>
                      void changeRole(member.id, event.target.value)
                    }
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => void removeMember(member.id)}
                    className="rounded-md border border-red-800 px-2 py-1 text-sm text-red-400 hover:bg-red-950"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
