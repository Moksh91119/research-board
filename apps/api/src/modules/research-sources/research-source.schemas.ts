import { z } from "zod";

export const createResearchSourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().url().max(2_000),
  description: z.string().trim().max(1_000).optional(),
});

export const updateResearchSourceSchema =
  createResearchSourceSchema.partial();

export type CreateResearchSourceInput =
  z.infer<typeof createResearchSourceSchema>;

export type UpdateResearchSourceInput =
  z.infer<typeof updateResearchSourceSchema>;

export const previewSourceMetadataSchema = z.object({
  url: z.string().url().max(2048),
});
