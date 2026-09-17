import { prisma } from "../../lib/prisma.js";
import type {
  CreateResearchSourceInput,
  UpdateResearchSourceInput,
} from "./research-source.schemas.js";
import { extractSourceMetadata } from "./metadata.service.js";

async function requireMembership(
  userId: string,
  workspaceId: string,
  canEdit = false,
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership || (canEdit && membership.role === "VIEWER")) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  return membership;
}

export async function createResearchSource(
  userId: string,
  workspaceId: string,
  input: CreateResearchSourceInput,
) {
  await requireMembership(userId, workspaceId, true);

  let metadata = {
    title: null as string | null,
    description: null as string | null,
    image: null as string | null,
  };

  try {
    metadata = await extractSourceMetadata(input.url);
  } catch {
    // Metadata extraction is optional.
  }

  return prisma.researchSource.create({
    data: {
      title: input.title || metadata.title || input.url,
      url: input.url,
      description: input.description || metadata.description,
      imageUrl: metadata.image,
      workspaceId,
      createdById: userId,
    },
  });
}

export async function listResearchSources(
  userId: string,
  workspaceId: string,
) {
  await requireMembership(userId, workspaceId);

  return prisma.researchSource.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateResearchSource(
  userId: string,
  sourceId: string,
  input: UpdateResearchSourceInput,
) {
  const source = await prisma.researchSource.findFirst({
    where: {
      id: sourceId,
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

  if (!source) {
    throw new Error("SOURCE_NOT_FOUND");
  }

  return prisma.researchSource.update({
    where: { id: sourceId },
    data: input,
  });
}

export async function deleteResearchSource(
  userId: string,
  sourceId: string,
) {
  const source = await prisma.researchSource.findFirst({
    where: {
      id: sourceId,
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

  if (!source) {
    throw new Error("SOURCE_NOT_FOUND");
  }

  await prisma.researchSource.delete({
    where: { id: sourceId },
  });
}
