import { prisma } from "../../lib/prisma.js";

import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "./document.schemas.js";

export async function createDocument(
  userId: string,
  workspaceId: string,
  input: CreateDocumentInput,
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  return prisma.document.create({
    data: {
      title: input.title,
      content: input.content,
      workspaceId,
      createdById: userId,
    },
  });
}

export async function listDocuments(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  return prisma.document.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          sources: true,
        },
      },
    },
  });
}

export async function getDocument(userId: string, documentId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspace: {
        memberships: {
          some: { userId },
        },
      },
    },
    select: {
      id: true,
      title: true,
      content: true,
      workspaceId: true,
      updatedAt: true,
      createdAt: true,
      createdById: true,
    },
  });

  if (!document) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  return document;
}

export async function updateDocument(
  userId: string,
  documentId: string,
  input: UpdateDocumentInput,
) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspace: {
        memberships: {
          some: {
            userId,
            role: {
              in: ["OWNER", "EDITOR"],
            },
          },
        },
      },
    },
  });

  if (!document) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  return prisma.document.update({
    where: { id: documentId },
    data: input,
  });
}

export async function deleteDocument(userId: string, documentId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspace: {
        memberships: {
          some: {
            userId,
            role: {
              in: ["OWNER", "EDITOR"],
            },
          },
        },
      },
    },
  });

  if (!document) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  await prisma.document.delete({
    where: { id: documentId },
  });
}
