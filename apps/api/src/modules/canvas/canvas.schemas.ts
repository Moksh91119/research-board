import { z } from "zod";

const canvasNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  data: z.record(z.unknown()).default({}),
});

const canvasEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
});

export const saveCanvasSchema = z.object({
  nodes: z.array(canvasNodeSchema).max(500),
  edges: z.array(canvasEdgeSchema).max(1000),
});

export type SaveCanvasInput = z.infer<typeof saveCanvasSchema>;
