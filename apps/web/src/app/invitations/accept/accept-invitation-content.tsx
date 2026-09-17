"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

export default function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleAccept() {
    if (!token) {
      setStatus("error");
      setMessage("Invitation token is missing.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await apiFetch("/auth/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      setStatus("success");
      setMessage("Invitation accepted.");

      router.push("/dashboard");
    } catch {
      setStatus("error");
      setMessage("Unable to accept invitation.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md space-y-5 rounded-xl border p-6">
        <div>
          <h1 className="text-xl font-semibold">Workspace Invitation</h1>

          <p className="text-sm text-muted-foreground">
            Accept the invitation to join this workspace.
          </p>
        </div>

        {message && (
          <p
            className={
              status === "error"
                ? "text-sm text-red-600"
                : "text-sm text-muted-foreground"
            }
          >
            {message}
          </p>
        )}

        <button
          type="button"
          disabled={!token || status === "loading" || status === "success"}
          onClick={() => void handleAccept()}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {status === "loading"
            ? "Accepting..."
            : status === "success"
              ? "Accepted"
              : "Accept invitation"}
        </button>
      </section>
    </main>
  );
}
