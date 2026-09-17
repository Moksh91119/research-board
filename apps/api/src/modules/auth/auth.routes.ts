import { Router } from "express";
import { login, logout, me, register } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { acceptInvitationController } from "../workspaces/invitation.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/invitations/accept", requireAuth, acceptInvitationController);

export default router;
