import type { Request, Response } from "express";
import {
  createInvitationSchema,
  invitationTokenSchema,
} from "./invitation.schemas.js";
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  listInvitations,
} from "./invitation.service.js";
import { ZodError } from "zod";

function userId(req: Request) {
  if (!req.userId) {
    throw new Error("UNAUTHORIZED");
  }

  return req.userId;
}

function param(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value) {
    throw new Error("INVALID_ROUTE_PARAM");
  }

  return value;
}

function handleError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      issues: error.issues,
    });
  }
  const code = error instanceof Error ? error.message : "UNKNOWN";

  const statuses: Record<string, number> = {
    UNAUTHORIZED: 401,
    OWNER_REQUIRED: 403,
    ALREADY_MEMBER: 409,
    INVITATION_EXISTS: 409,
    INVITATION_NOT_FOUND: 404,
    INVITATION_UNAVAILABLE: 409,
    INVITATION_EXPIRED: 410,
    EMAIL_MISMATCH: 403,
    INVALID_ROUTE_PARAM: 400,
  };

  return res.status(statuses[code] ?? 500).json({
    error: code,
  });
}

export async function createInvitationController(req: Request, res: Response) {
  try {
    const input = createInvitationSchema.parse(req.body);

    const result = await createInvitation(
      userId(req),
      param(req.params.workspaceId),
      input,
    );

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function listInvitationsController(req: Request, res: Response) {
  try {
    const invitations = await listInvitations(
      userId(req),
      param(req.params.workspaceId),
    );

    return res.json({ invitations });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function cancelInvitationController(req: Request, res: Response) {
  try {
    await cancelInvitation(
      userId(req),
      param(req.params.workspaceId),
      param(req.params.invitationId),
    );

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}

export async function acceptInvitationController(req: Request, res: Response) {
  try {
    const { token } = invitationTokenSchema.parse(req.body);

    const result = await acceptInvitation(userId(req), token);

    return res.json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
