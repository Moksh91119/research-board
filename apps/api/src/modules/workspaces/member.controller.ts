import type { Request, Response } from "express";
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "./member.schemas.js";
import {
  inviteMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from "./member.service.js";

function getParam(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !value) {
    throw new Error("INVALID_ROUTE_PARAM");
  }

  return value;
}

function getUserId(req: Request) {
  if (!req.userId) {
    throw new Error("UNAUTHENTICATED");
  }

  return req.userId;
}

function handleError(error: unknown, res: Response) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  const statusMap: Record<string, number> = {
    UNAUTHENTICATED: 401,
    WORKSPACE_ACCESS_DENIED: 403,
    OWNER_REQUIRED: 403,
    USER_NOT_FOUND: 404,
    MEMBER_NOT_FOUND: 404,
    MEMBER_ALREADY_EXISTS: 409,
    OWNER_ROLE_IMMUTABLE: 400,
    OWNER_CANNOT_BE_REMOVED: 400,
  };

  return res.status(statusMap[code] ?? 500).json({
    error: code,
  });
}

export async function listMembersController(req: Request, res: Response) {
  try {
    const members = await listMembers(
      getUserId(req),
      getParam(req.params.workspaceId),
    );

    return res.json({ members });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function inviteMemberController(req: Request, res: Response) {
  try {
    const input = inviteMemberSchema.parse(req.body);

    const member = await inviteMember(
      getUserId(req),
      getParam(req.params.workspaceId),
      input,
    );

    return res.status(201).json({ member });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateMemberRoleController(req: Request, res: Response) {
  try {
    const input = updateMemberRoleSchema.parse(req.body);

    const member = await updateMemberRole(
      getUserId(req),
      getParam(req.params.workspaceId),
      getParam(req.params.memberId),
      input,
    );

    return res.json({ member });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function removeMemberController(req: Request, res: Response) {
  try {
    await removeMember(
      getUserId(req),
      getParam(req.params.workspaceId),
      getParam(req.params.memberId),
    );

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}
