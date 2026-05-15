import type { Comment } from "@/lib/types";

export function appendUniqueComment(
  comments: Comment[],
  comment: Comment,
): Comment[] {
  if (comment.id && comments.some((candidate) => candidate.id === comment.id)) {
    return comments;
  }

  return [...comments, comment];
}
