import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createWorkspaceController,
  listWorkspacesController,
  getWorkspaceController,
} from "./workspace.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createWorkspaceController);
router.get("/", listWorkspacesController);
router.get("/:workspaceId", getWorkspaceController);

export default router;
