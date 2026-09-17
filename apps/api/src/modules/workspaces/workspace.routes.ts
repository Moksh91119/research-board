import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createWorkspaceController,
  listWorkspacesController,
} from "./workspace.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createWorkspaceController);
router.get("/", listWorkspacesController);

export default router;
