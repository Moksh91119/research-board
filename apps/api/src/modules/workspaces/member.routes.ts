import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  inviteMemberController,
  listMembersController,
  removeMemberController,
  updateMemberRoleController,
} from "./member.controller.js";

const router = Router({
  mergeParams: true,
});

router.use(requireAuth);

router.get("/", listMembersController);
router.post("/", inviteMemberController);

router.patch("/:memberId", updateMemberRoleController);
router.delete("/:memberId", removeMemberController);

export default router;
