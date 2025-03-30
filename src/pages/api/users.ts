import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import connectDB from "@/db";
import User from "@/db/User";
import { z } from "zod";

// Schema for validating query parameters
const GetUsersQuerySchema = z.object({
  ids: z.string().optional(),
});

/**
 * API endpoint to fetch multiple users at once
 * GET /api/users?ids=id1,id2,id3
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    return await getUsers(req, res);
  } catch (error) {
    console.error("Error in users API:", error);
    return res.status(500).json({
      error: "Failed to process request",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  // Parse and validate query parameters
  const parseResult = GetUsersQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parseResult.error.issues,
    });
  }

  const { ids } = parseResult.data;

  // IDs parameter is required
  if (!ids) {
    return res.status(400).json({
      error: "User IDs are required. Provide as comma-separated list.",
    });
  }

  try {
    // Parse the comma-separated list of IDs
    const userIds = ids.split(",");

    // Validate each ID
    const validUserIds = userIds.filter(id =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validUserIds.length === 0) {
      return res.status(400).json({ error: "No valid user IDs provided" });
    }

    // Connect to MongoDB using mongoose
    await connectDB();

    // Find users by IDs
    const users = await User.find({
      _id: { $in: validUserIds },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    // Return standardized user data
    return res.status(200).json({
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio || "",
        emailVerified: user.emailVerified,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      error: "Failed to fetch user data",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
