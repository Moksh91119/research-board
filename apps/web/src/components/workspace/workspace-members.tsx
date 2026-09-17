"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Role = "OWNER" | "EDITOR" | "VIEWER";

type Member = {
  id: string;
  role: Role;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: "EDITOR" | "VIEWER";
  status: "PENDING";
  expiresAt: string;
  createdAt: string;
};

type Props = {
  workspaceId: string;
  currentRole?: string;
};

export function WorkspaceMembers({ workspaceId, currentRole }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = currentRole === "OWNER";

  async function loadData() {
    const memberResponse = await apiFetch(`/workspaces/${workspaceId}/members`);

    const memberData = (await memberResponse.json()) as {
      members: Member[];
    };

    let invitationData: { invitations: Invitation[] } = {
      invitations: [],
    };

    if (isOwner) {
      const invitationResponse = await apiFetch(
        `/workspaces/${workspaceId}/invitations`,
      );

      invitationData = (await invitationResponse.json()) as {
        invitations: Invitation[];
      };
    }

    setMembers(memberData.members);
    setInvitations(invitationData.invitations);
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve()
      .then(() => loadData())
      .catch(() => {
        if (!cancelled) setError("Unable to load workspace members.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, isOwner]);

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      await apiFetch(`/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });

      setEmail("");
      await loadData();
    } catch {
      setError("Unable to create invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRole(memberId: string, nextRole: "EDITOR" | "VIEWER") {
    try {
      await apiFetch(`/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });

      await loadData();
    } catch {
      setError("Unable to update member role.");
    }
  }

  async function removeMember(memberId: string) {
    if (!window.confirm("Remove this member?")) return;

    try {
      await apiFetch(`/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
      });

      await loadData();
    } catch {
      setError("Unable to remove member.");
    }
  }

  async function cancelInvitation(invitationId: string) {
    if (!window.confirm("Cancel this invitation?")) return;

    try {
      await apiFetch(`/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "DELETE",
      });

      await loadData();
    } catch {
      setError("Unable to cancel invitation.");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading members...</p>;
  }

  return (
    <section className="space-y-6 rounded-xl border p-6">
      <div>
        <h2 className="text-lg font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage workspace access.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div>
              <p className="text-sm font-medium">{member.user.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(member.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && member.role !== "OWNER" ? (
                <>
                  <select
                    value={member.role}
                    onChange={(event) =>
                      void updateRole(
                        member.id,
                        event.target.value as "EDITOR" | "VIEWER",
                      )
                    }
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => void removeMember(member.id)}
                    className="text-sm text-red-600"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {member.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {isOwner && (
        <>
          <form onSubmit={inviteMember} className="space-y-3 border-t pt-5">
            <h3 className="font-medium">Invite member</h3>

            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="member@example.com"
                className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
              />

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "EDITOR" | "VIEWER")
                }
                className="rounded-md border px-3 py-2 text-sm"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {submitting ? "Inviting..." : "Invite"}
              </button>
            </div>
          </form>

          {invitations.length > 0 && (
            <div className="space-y-3 border-t pt-5">
              <h3 className="font-medium">Pending invitations</h3>

              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.role} · Expires{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void cancelInvitation(invitation.id)}
                    className="text-sm text-red-600"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
