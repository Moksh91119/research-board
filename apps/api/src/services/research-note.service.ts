import { prisma } from "../lib/prisma.js";

type CreateNoteInput = {
  documentId: string;
  sourceId?: string;
  content: string;
  quote?: string;
  locator?: string;
};

type UpdateNoteInput = {
  content?: string;
  quote?: string | null;
  locator?: string | null;
  sourceId?: string | null;
};

async function requireDocumentAccess(
  userId: string,
  documentId: string,
  canEdit = false,
) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspace: {
        memberships: {
          some: {
            userId,
            ...(canEdit ? { role: { in: ["OWNER", "EDITOR"] } } : {}),
          },
        },
      },
    },
  });

  if (!document) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  return document;
}

async function requireSourceInWorkspace(sourceId: string, workspaceId: string) {
  const source = await prisma.researchSource.findFirst({
    where: {
      id: sourceId,
      workspaceId,
    },
  });

  if (!source) {
    throw new Error("SOURCE_NOT_FOUND");
  }
}

export async function createResearchNote(
  userId: string,
  input: CreateNoteInput,
) {
  const document = await requireDocumentAccess(userId, input.documentId, true);

  if (!input.content.trim()) {
    throw new Error("NOTE_CONTENT_REQUIRED");
  }

  if (input.sourceId) {
    await requireSourceInWorkspace(input.sourceId, document.workspaceId);
  }

  return prisma.researchNote.create({
    data: {
      documentId: input.documentId,
      sourceId: input.sourceId,
      content: input.content.trim(),
      quote: input.quote?.trim() || null,
      locator: input.locator?.trim() || null,
      createdById: userId,
    },
    include: {
      source: true,
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function listResearchNotes(userId: string, documentId: string) {
  await requireDocumentAccess(userId, documentId);

  return prisma.researchNote.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    include: {
      source: true,
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function updateResearchNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput,
) {
  const note = await prisma.researchNote.findFirst({
    where: {
      id: noteId,
      document: {
        workspace: {
          memberships: {
            some: {
              userId,
              role: { in: ["OWNER", "EDITOR"] },
            },
          },
        },
      },
    },
    include: {
      document: true,
    },
  });

  if (!note) {
    throw new Error("NOTE_NOT_FOUND");
  }

  if (input.sourceId) {
    await requireSourceInWorkspace(input.sourceId, note.document.workspaceId);
  }

  return prisma.researchNote.update({
    where: { id: noteId },
    data: {
      ...(input.content !== undefined && {
        content: input.content.trim(),
      }),
      ...(input.quote !== undefined && {
        quote: input.quote?.trim() || null,
      }),
      ...(input.locator !== undefined && {
        locator: input.locator?.trim() || null,
      }),
      ...(input.sourceId !== undefined && {
        sourceId: input.sourceId,
      }),
    },
    include: {
      source: true,
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteResearchNote(userId: string, noteId: string) {
  const note = await prisma.researchNote.findFirst({
    where: {
      id: noteId,
      document: {
        workspace: {
          memberships: {
            some: {
              userId,
              role: { in: ["OWNER", "EDITOR"] },
            },
          },
        },
      },
    },
  });

  if (!note) {
    throw new Error("NOTE_NOT_FOUND");
  }

  await prisma.researchNote.delete({
    where: { id: noteId },
  });
}
