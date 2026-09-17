import { prisma } from "../../lib/prisma.js";

export async function createWorkspace(
  userId: string,
  input: {
    name: string;
    description?: string;
  },
) {
  return prisma.workspace.create({
    data: {
      name: input.name,
      description: input.description,
      memberships: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    include: {
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });
}

export async function listUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: {
      memberships: {
        some: { userId },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });
}

export async function getUserWorkspace(
  userId: string,
  workspaceId: string,
) {
  return prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      memberships: {
        some: { userId },
      },
    },
    include: {
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });
}
