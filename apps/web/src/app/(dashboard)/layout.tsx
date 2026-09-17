"use client";

import { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const params = useParams<{ workspaceId?: string }>();
  const workspaceId = params.workspaceId;

  async function handleLogout() {
    await apiFetch("/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-800 bg-slate-900 p-6">
        <h1 className="text-xl font-bold">ResearchBoard</h1>

        <nav className="mt-10 space-y-2 text-sm text-slate-300">
          <button
            onClick={() => router.push("/dashboard")}
            className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-800"
          >
            Workspaces
          </button>

          {workspaceId && (
            <button
              onClick={() => router.push(`/dashboard/${workspaceId}/canvas`)}
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-800"
            >
              Canvas
            </button>
          )}

          <button
            disabled
            className="block w-full rounded-lg px-3 py-2 text-left text-slate-500"
          >
            Recent Research
          </button>

          <button
            disabled
            className="block w-full rounded-lg px-3 py-2 text-left text-slate-500"
          >
            Settings
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-10 text-sm text-red-400 hover:text-red-300"
        >
          Sign out
        </button>
      </aside>

      <main className="ml-64 min-h-screen flex-1">{children}</main>
    </div>
  );
}
