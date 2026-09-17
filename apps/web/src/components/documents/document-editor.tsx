"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type DocumentEditorProps = {
  documentId: string;
};

type DocumentData = {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
};

export default function DocumentEditor({ documentId }: DocumentEditorProps) {
  const router = useRouter();

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  useEffect(() => {
    async function loadDocument() {
      try {
        const response = await apiFetch(`/documents/${documentId}`);

        if (!response.ok) {
          throw new Error("Unable to load document");
        }

        const data = await response.json();

        setDocument(data.document);
        setTitle(data.document.title);

        editor?.commands.setContent(data.document.content || "");
      } catch {
        setError("Unable to load document");
      } finally {
        setLoading(false);
      }
    }

    if (editor) {
      void loadDocument();
    }
  }, [documentId, editor]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editor) return;

    setSaving(true);
    setError("");

    try {
      const response = await apiFetch(`/documents/${documentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          content: editor.getHTML(),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save document");
      }

      const data = await response.json();
      setDocument(data.document);
    } catch {
      setError("Unable to save document");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!document) return;

    if (!window.confirm("Delete this document?")) return;

    const response = await apiFetch(`/documents/${documentId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.push(`/dashboard/${document.workspaceId}`);
      router.refresh();
    } else {
      setError("Unable to delete document");
    }
  }

  if (loading) {
    return <p className="p-8 text-slate-400">Loading document...</p>;
  }

  if (!document) {
    return <p className="p-8 text-red-400">{error || "Document not found"}</p>;
  }

  return (
    <section className="p-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/${document.workspaceId}`)}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to workspace
        </button>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-2xl font-semibold outline-none focus:border-blue-500"
              maxLength={200}
              required
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900">
            <div className="flex gap-2 border-b border-slate-700 p-3">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className="rounded px-3 py-1 font-bold hover:bg-slate-700"
              >
                B
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className="rounded px-3 py-1 italic hover:bg-slate-700"
              >
                I
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className="rounded px-3 py-1 hover:bg-slate-700"
              >
                • List
              </button>

              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                className="rounded px-3 py-1 hover:bg-slate-700"
              >
                1. List
              </button>
            </div>

            <EditorContent editor={editor} className="min-h-[500px]" />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>

        <button
          type="button"
          onClick={handleDelete}
          className="mt-6 text-sm text-red-400 hover:text-red-300"
        >
          Delete document
        </button>
      </div>
    </section>
  );
}
