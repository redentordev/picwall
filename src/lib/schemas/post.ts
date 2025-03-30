import { z } from 'zod';

// Common schemas
export const UserIdSchema = z.string().min(1, 'User ID is required');
export const PostIdSchema = z.string().min(1, 'Post ID is required');

// POST endpoint schemas
export const CreatePostSchema = z.object({
  userId: UserIdSchema,
  image: z.string().min(1, 'Image URL is required'),
  caption: z.string().optional().default('')
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

// GET endpoint schemas
export const GetPostQuerySchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().optional().default(10),
  skip: z.coerce.number().optional().default(0)
});

export type GetPostQuery = z.infer<typeof GetPostQuerySchema>;

// PUT endpoint schemas
export const LikePostSchema = z.object({
  id: PostIdSchema,
  userId: UserIdSchema,
  action: z.literal('like')
});

export const UnlikePostSchema = z.object({
  id: PostIdSchema,
  userId: UserIdSchema,
  action: z.literal('unlike')
});

export const CommentPostSchema = z.object({
  id: PostIdSchema,
  userId: UserIdSchema,
  action: z.literal('comment'),
  comment: z.string().min(1, 'Comment text is required')
});

export const UpdatePostCaptionSchema = z.object({
  id: PostIdSchema,
  caption: z.string()
});

export type LikePostInput = z.infer<typeof LikePostSchema>;
export type UnlikePostInput = z.infer<typeof UnlikePostSchema>;
export type CommentPostInput = z.infer<typeof CommentPostSchema>;
export type UpdatePostCaptionInput = z.infer<typeof UpdatePostCaptionSchema>;

// Combined PUT schema with discriminated union
export const UpdatePostSchema = z.discriminatedUnion('action', [
  LikePostSchema,
  UnlikePostSchema,
  CommentPostSchema,
  UpdatePostCaptionSchema.extend({ action: z.undefined() })
]);

export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

// DELETE endpoint schema
export const DeletePostSchema = z.object({
  id: PostIdSchema
});

export type DeletePostInput = z.infer<typeof DeletePostSchema>;
