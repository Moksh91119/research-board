import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
});

export const invitationTokenSchema = z.object({
  token: z.string().min(32),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
