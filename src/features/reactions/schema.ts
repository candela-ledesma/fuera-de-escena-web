import { z } from "zod";

export const ANON_ID_COOKIE = "anon_id";

export const REACTION_TYPES = ["like", "love", "wow", "applause"] as const;

export const REACTION_LABELS: Record<(typeof REACTION_TYPES)[number], string> = {
  like: "👍",
  love: "❤️",
  wow: "😮",
  applause: "👏",
};

export const toggleReactionSchema = z.object({
  reviewId: z.string().uuid(),
  type: z.enum(REACTION_TYPES),
});
