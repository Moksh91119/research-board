import type { Request, Response } from "express";
import {
  createResearchNote,
  deleteResearchNote,
  listResearchNotes,
  updateResearchNote,
} from "../services/research-note.service.js";

function getParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function handleError(error: unknown, response: Response) {
  const code = error instanceof Error ? error.message : "";

  const status =
    code === "DOCUMENT_NOT_FOUND" || code === "NOTE_NOT_FOUND"
      ? 404
      : code === "SOURCE_NOT_FOUND"
        ? 404
        : code === "NOTE_CONTENT_REQUIRED"
          ? 400
          : 500;

  return response.status(status).json({
    error: code || "INTERNAL_SERVER_ERROR",
  });
}

export async function createNote(req: Request, res: Response) {
  try {
    const note = await createResearchNote(req.user!.id, {
      documentId: getParam(req.params.documentId),
      sourceId: req.body.sourceId,
      content: req.body.content,
      quote: req.body.quote,
      locator: req.body.locator,
    });

    return res.status(201).json({ note });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getNotes(req: Request, res: Response) {
  try {
    const notes = await listResearchNotes(
      req.user!.id,
      getParam(req.params.documentId),
    );

    return res.json({ notes });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateNote(req: Request, res: Response) {
  try {
    const note = await updateResearchNote(
      req.user!.id,
      getParam(req.params.noteId),
      {
        content: req.body.content,
        quote: req.body.quote,
        locator: req.body.locator,
        sourceId: req.body.sourceId,
      },
    );

    return res.json({ note });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteNote(req: Request, res: Response) {
  try {
    await deleteResearchNote(req.user!.id, getParam(req.params.noteId));

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}
