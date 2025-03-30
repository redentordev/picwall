import { z } from 'zod';

// Common schemas
export const UserIdSchema = z.string().min(1, 'User ID is required');
export const EmailSchema = z.string().email('Invalid email address');

// GET endpoint schemas
export const GetUserQuerySchema = z.object({
  id: z.string().optional(),
  email: z.string().email().optional()
});

export type GetUserQuery = z.infer<typeof GetUserQuerySchema>;

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  image: z.string().optional().nullable(),
  bio: z.string().max(150, 'Bio must be 150 characters or less').optional(),
  emailVerified: z.boolean().default(false)
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// PUT endpoint schemas for updating user profile
export const UpdateUserProfileSchema = z.object({
  id: UserIdSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(150, 'Bio must be 150 characters or less').optional(),
  image: z.string().optional().nullable()
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;

// API response schema
export const UserResponseSchema = z.object({
  user: UserProfileSchema
});

export type UserResponse = z.infer<typeof UserResponseSchema>; 