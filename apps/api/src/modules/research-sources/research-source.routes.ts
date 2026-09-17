import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createResearchSourceController,
  deleteResearchSourceController,
  listResearchSourcesController,
  updateResearchSourceController,
} from "./research-source.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/workspaces/:workspaceId/sources", createResearchSourceController);

router.get("/workspaces/:workspaceId/sources", listResearchSourcesController);

router.patch("/sources/:sourceId", updateResearchSourceController);

router.delete("/sources/:sourceId", deleteResearchSourceController);

export default router;
