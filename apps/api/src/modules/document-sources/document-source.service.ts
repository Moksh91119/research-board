import { prisma } from "../../lib/prisma.js";

async function verifyAccess(
  userId: string,
  documentId: string,
  sourceId: string,
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

  const source = await prisma.researchSource.findFirst({
    where: {
      id: sourceId,
      workspaceId: document?.workspaceId,
    },
  });

  if (!document || !source) {
    throw new Error("RESOURCE_NOT_FOUND");
  }

  return { document, source };
}

export async function linkSource(
  userId: string,
  documentId: string,
  sourceId: string,
) {
  await verifyAccess(userId, documentId, sourceId);

  return prisma.documentSource.upsert({
    where: {
      documentId_sourceId: {
        documentId,
        sourceId,
      },
    },
    update: {},
    create: {
      documentId,
      sourceId,
    },
    include: {
      source: true,
    },
  });
}

export async function listDocumentSources(
  userId: string,
  documentId: string,
) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspace: {
        memberships: {
          some: { userId },
        },
      },
    },
  });

  if (!document) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  return prisma.documentSource.findMany({
    where: { documentId },
    include: { source: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function unlinkSource(
  userId: string,
  documentId: string,
  sourceId: string,
) {
  await verifyAccess(userId, documentId, sourceId);

  await prisma.documentSource.delete({
    where: {
      documentId_sourceId: {
        documentId,
        sourceId,
      },
    },
  });
}
