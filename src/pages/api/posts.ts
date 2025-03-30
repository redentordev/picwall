import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import connectDB from "@/db";
import Post from "@/db/Post";
import { z } from "zod";

// Schema for validating query parameters
const GetPostsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 50)),
  skip: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 0)),
  userId: z.string().optional(),
  sort: z.enum(["latest", "popular"]).optional().default("latest"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse and validate query parameters
    const parseResult = GetPostsQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: parseResult.error.issues,
      });
    }

    const { limit, skip, userId, sort } = parseResult.data;

    await connectDB();

    // Build query
    const query: any = {};

    // Filter by user if provided
    if (userId) {
      // Check if ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }

      query.userId = userId;
    }

    // Determine sort order
    let sortOptions: any = {};
    if (sort === "latest") {
      sortOptions.createdAt = -1; // Newest first
    } else if (sort === "popular") {
      // For 'popular', we sort by likes count
      // Assuming likes is an array, we sort by its length
      sortOptions = { "likes.length": -1, createdAt: -1 };
    }

    // Fetch posts with pagination
    const posts = await Post.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Post.countDocuments(query);

    // Return formatted posts
    return res.status(200).json({
      posts: posts.map(post => ({
        id: post._id.toString(),
        userId: post.userId?.toString(),
        image: post.image,
        caption: post.caption,
        likes: Array.isArray(post.likes) ? post.likes : [],
        comments: Array.isArray(post.comments) ? post.comments : [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({
      error: "Failed to fetch posts",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
