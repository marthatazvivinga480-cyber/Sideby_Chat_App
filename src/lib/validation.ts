import { z } from "zod";
export const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores"),
  bio: z.string().trim().max(160),
});
export const messageSchema = z
  .string()
  .trim()
  .min(1, "Write a message first")
  .max(4000, "Keep messages under 4,000 characters");
export const authSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];
export function validateFile(file: { size: number; type: string }) {
  if (file.size > MAX_FILE_SIZE) throw new Error("Files must be under 5 MB");
  if (!FILE_TYPES.includes(file.type))
    throw new Error("Choose a PNG, JPG, WebP, PDF or text file");
}

export function readableError(error: unknown, fallback = "Please try again") {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
}
