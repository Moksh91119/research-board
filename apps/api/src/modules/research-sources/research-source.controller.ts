import type { Request, Response } from "express";
import {
  createResearchSourceSchema,
  updateResearchSourceSchema,
} from "./research-source.schemas.js";
import {
  createResearchSource,
  deleteResearchSource,
  listResearchSources,
  updateResearchSource,
} from "./research-source.service.js";

import { refreshSourceMetadata } from "./metadata.service.js";

function getParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function createResearchSourceController(
  req: Request,
  res: Response,
) {
  const workspaceId = getParam(req.params.workspaceId);
  const input = createResearchSourceSchema.parse(req.body);

  const source = await createResearchSource(req.userId!, workspaceId, input);

  res.status(201).json({ source });
}

export async function listResearchSourcesController(
  req: Request,
  res: Response,
) {
  const workspaceId = getParam(req.params.workspaceId);

  const sources = await listResearchSources(req.userId!, workspaceId);

  res.json({ sources });
}

export async function updateResearchSourceController(
  req: Request,
  res: Response,
) {
  const sourceId = getParam(req.params.sourceId);
  const input = updateResearchSourceSchema.parse(req.body);

  const source = await updateResearchSource(req.userId!, sourceId, input);

  res.json({ source });
}

export async function deleteResearchSourceController(
  req: Request,
  res: Response,
) {
  const sourceId = getParam(req.params.sourceId);

  await deleteResearchSource(req.userId!, sourceId);

  res.status(204).send();
}

import { extractSourceMetadata } from "./metadata.service.js";
import { previewSourceMetadataSchema } from "./research-source.schemas.js";

export async function previewSourceMetadataController(
  req: Request,
  res: Response,
) {
  const { url } = previewSourceMetadataSchema.parse(req.body);

  const metadata = await extractSourceMetadata(url);

  res.json({ metadata });
}

export async function refreshSourceMetadataController(
  req: Request,
  res: Response,
) {
  const sourceId = String(req.params.sourceId);
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const source = await refreshSourceMetadata(sourceId, userId);

  return res.json({ source });
}
