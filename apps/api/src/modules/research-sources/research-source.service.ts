import { prisma } from "../../lib/prisma.js";
import type {
  CreateResearchSourceInput,
  UpdateResearchSourceInput,
} from "./research-source.schemas.js";

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

  if (
    !membership ||
    (canEdit && membership.role === "VIEWER")
  ) {
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

  return prisma.researchSource.create({
    data: {
      ...input,
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
