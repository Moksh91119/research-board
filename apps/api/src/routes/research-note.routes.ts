import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../controllers/research-note.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/documents/:documentId/notes", createNote);
router.get("/documents/:documentId/notes", getNotes);
router.patch("/notes/:noteId", updateNote);
router.delete("/notes/:noteId", deleteNote);

export default router;
