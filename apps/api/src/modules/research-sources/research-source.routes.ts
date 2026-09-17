import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createResearchSourceController,
  deleteResearchSourceController,
  listResearchSourcesController,
  updateResearchSourceController,
  previewSourceMetadataController,
  refreshSourceMetadataController,
} from "./research-source.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/workspaces/:workspaceId/sources", createResearchSourceController);

router.get("/workspaces/:workspaceId/sources", listResearchSourcesController);

router.patch("/sources/:sourceId", updateResearchSourceController);

router.delete("/sources/:sourceId", deleteResearchSourceController);

router.post("/metadata/preview", previewSourceMetadataController);

router.post("/:sourceId/metadata/refresh", refreshSourceMetadataController);

export default router;
