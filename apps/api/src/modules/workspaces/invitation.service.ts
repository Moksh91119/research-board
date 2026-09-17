import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import type { CreateInvitationInput } from "./invitation.schemas.ts";

const INVITATION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

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
}

export async function createInvitation(
  userId: string,
  workspaceId: string,
  input: CreateInvitationInput,
) {
  await requireOwner(userId, workspaceId);

  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: {
        email: input.email,
      },
    },
  });

  if (existingMember) {
    throw new Error("ALREADY_MEMBER");
  }

  const existingInvitation = await prisma.workspaceInvitation.findFirst({
    where: {
      workspaceId,
      email: input.email,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingInvitation) {
    throw new Error("INVITATION_EXISTS");
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const invitation = await prisma.workspaceInvitation.create({
    data: {
      email: input.email,
      role: input.role,
      tokenHash,
      expiresAt: new Date(Date.now() + INVITATION_DURATION_MS),
      workspaceId,
      invitedById: userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return {
    invitation,
    token,
  };
}

export async function listInvitations(userId: string, workspaceId: string) {
  await requireOwner(userId, workspaceId);

  return prisma.workspaceInvitation.findMany({
    where: {
      workspaceId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

export async function cancelInvitation(
  userId: string,
  workspaceId: string,
  invitationId: string,
) {
  await requireOwner(userId, workspaceId);

  const invitation = await prisma.workspaceInvitation.findFirst({
    where: {
      id: invitationId,
      workspaceId,
      status: "PENDING",
    },
  });

  if (!invitation) {
    throw new Error("INVITATION_NOT_FOUND");
  }

  return prisma.workspaceInvitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: "CANCELLED",
    },
  });
}

export async function acceptInvitation(userId: string, token: string) {
  const tokenHash = hashToken(token);

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.workspaceInvitation.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!invitation) {
      throw new Error("INVITATION_NOT_FOUND");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("INVITATION_UNAVAILABLE");
    }

    if (invitation.expiresAt <= new Date()) {
      await tx.workspaceInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "EXPIRED",
        },
      });

      throw new Error("INVITATION_EXPIRED");
    }

    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
      },
    });

    if (!user || user.email !== invitation.email) {
      throw new Error("EMAIL_MISMATCH");
    }

    await tx.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invitation.workspaceId,
        },
      },
      update: {
        role: invitation.role,
      },
      create: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    });

    await tx.workspaceInvitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: "ACCEPTED",
      },
    });

    return {
      workspaceId: invitation.workspaceId,
      role: invitation.role,
    };
  });
}
