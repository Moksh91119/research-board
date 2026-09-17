import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentController,
  listDocumentsController,
  updateDocumentController,
} from "./document.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/workspaces/:workspaceId/documents", createDocumentController);

router.get("/workspaces/:workspaceId/documents", listDocumentsController);

router.get("/documents/:documentId", getDocumentController);

router.patch("/documents/:documentId", updateDocumentController);

router.delete("/documents/:documentId", deleteDocumentController);

export default router;
