import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  getCanvasController,
  saveCanvasController,
} from "./canvas.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/workspaces/:workspaceId/canvas", getCanvasController);

router.put("/workspaces/:workspaceId/canvas", saveCanvasController);

export default router;
