import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createWorkspaceController,
  listWorkspacesController,
  getWorkspaceController,
} from "./workspace.controller.js";
import memberRoutes from "./member.routes.js";
import invitationRoutes from "./invitation.routes.js";

const router = Router();

router.use(requireAuth);

router.post("/", createWorkspaceController);
router.get("/", listWorkspacesController);
router.get("/:workspaceId", getWorkspaceController);
router.use("/:workspaceId/members", memberRoutes);
router.use("/:workspaceId/invitations", invitationRoutes);

export default router;
