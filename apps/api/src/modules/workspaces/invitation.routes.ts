import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  acceptInvitationController,
  cancelInvitationController,
  createInvitationController,
  listInvitationsController,
} from "./invitation.controller.js";

const router = Router({
  mergeParams: true,
});

router.use(requireAuth);

router.get("/", listInvitationsController);
router.post("/", createInvitationController);

router.delete("/:invitationId", cancelInvitationController);

export default router;
