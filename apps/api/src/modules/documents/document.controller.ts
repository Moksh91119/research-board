import type { Request, Response } from "express";
import {
  createDocumentSchema,
  updateDocumentSchema,
} from "./document.schemas.js";
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from "./document.service.js";

function getParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function createDocumentController(req: Request, res: Response) {
  const workspaceId = getParam(req.params.workspaceId);
  const input = createDocumentSchema.parse(req.body);

  const document = await createDocument(req.userId!, workspaceId, input);

  res.status(201).json({ document });
}

export async function listDocumentsController(req: Request, res: Response) {
  const workspaceId = getParam(req.params.workspaceId);

  const documents = await listDocuments(req.userId!, workspaceId);

  res.json({ documents });
}

export async function getDocumentController(req: Request, res: Response) {
  const documentId = getParam(req.params.documentId);

  const document = await getDocument(req.userId!, documentId);

  res.json({ document });
}

export async function updateDocumentController(req: Request, res: Response) {
  const documentId = getParam(req.params.documentId);
  const input = updateDocumentSchema.parse(req.body);

  const document = await updateDocument(req.userId!, documentId, input);

  res.json({ document });
}

export async function deleteDocumentController(req: Request, res: Response) {
  const documentId = getParam(req.params.documentId);

  await deleteDocument(req.userId!, documentId);

  res.status(204).send();
}
