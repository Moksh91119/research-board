import type { Request, Response } from "express";
import { createWorkspaceSchema } from "./workspace.schemas.js";
import {
  createWorkspace,
  listUserWorkspaces,
  getUserWorkspace,
} from "./workspace.service.js";

export async function createWorkspaceController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = createWorkspaceSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
    return;
  }

  const workspace = await createWorkspace(userId, parsed.data);

  res.status(201).json({ workspace });
}

export async function listWorkspacesController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const workspaces = await listUserWorkspaces(userId);

  res.status(200).json({ workspaces });
}

export async function getWorkspaceController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawWorkspaceId = req.params.workspaceId;
  const workspaceId = Array.isArray(rawWorkspaceId)
    ? rawWorkspaceId[0]
    : rawWorkspaceId;

  if (!workspaceId) {
    res.status(400).json({ error: "Workspace ID is required" });
    return;
  }

  const workspace = await getUserWorkspace(userId, workspaceId);

  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  res.status(200).json({ workspace });
}
