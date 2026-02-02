
import { z } from "zod";

export const getMessagesSchema = z.object({
  roomId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export const editMessageSchema = z.object({
  text: z.string().min(1).max(200),
});

export const messageIdSchema = z.object({
  id: z.string().uuid(),
});