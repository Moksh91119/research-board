import { prisma } from "../../lib/prisma.js";
import type {
  InviteMemberInput,
  UpdateMemberRoleInput,
} from "./member.schemas.js";

async function requireOwner(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    throw new Error("OWNER_REQUIRED");
  }

  return membership;
}

export async function listMembers(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("WORKSPACE_ACCESS_DENIED");
  }

  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function inviteMember(
  userId: string,
  workspaceId: string,
  input: InviteMemberInput,
) {
  await requireOwner(userId, workspaceId);

  const invitedUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!invitedUser) {
    throw new Error("USER_NOT_FOUND");
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: invitedUser.id,
        workspaceId,
      },
    },
  });

  if (existingMembership) {
    throw new Error("MEMBER_ALREADY_EXISTS");
  }

  return prisma.workspaceMember.create({
    data: {
      userId: invitedUser.id,
      workspaceId,
      role: input.role,
    },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function updateMemberRole(
  userId: string,
  workspaceId: string,
  memberId: string,
  input: UpdateMemberRoleInput,
) {
  await requireOwner(userId, workspaceId);

  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.workspaceId !== workspaceId) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  if (member.role === "OWNER") {
    throw new Error("OWNER_ROLE_IMMUTABLE");
  }

  return prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: input.role },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function removeMember(
  userId: string,
  workspaceId: string,
  memberId: string,
) {
  await requireOwner(userId, workspaceId);

  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.workspaceId !== workspaceId) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  if (member.role === "OWNER") {
    throw new Error("OWNER_CANNOT_BE_REMOVED");
  }

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });
}
