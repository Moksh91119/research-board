import type { Request, Response } from "express";
import { saveCanvasSchema } from "./canvas.schemas.js";
import { getCanvas, saveCanvas } from "./canvas.service.js";

export async function getCanvasController(req: Request, res: Response) {
  const userId = req.userId;
  const workspaceId = req.params.workspaceId as string;

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const canvas = await getCanvas(userId, workspaceId);

  return res.status(200).json(canvas);
}

export async function saveCanvasController(req: Request, res: Response) {
  const userId = req.userId;
  const workspaceId = req.params.workspaceId as string;

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const input = saveCanvasSchema.parse(req.body);

  const result = await saveCanvas(userId, workspaceId, input);

  return res.status(200).json(result);
}
