import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import connectDB from "@/db";
import User from "@/db/User";
import {
  GetUserQuerySchema,
  UpdateUserProfileSchema,
} from "@/lib/schemas/user";
import { auth } from "@/lib/auth";

// This is a simplified API endpoint for development/demo purposes
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Handle different HTTP methods
    switch (req.method) {
      case "GET":
        return await getUser(req, res);
      case "PUT":
        return await updateUser(req, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in user API:", error);
    return res.status(500).json({
      error: "Failed to process request",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function getUser(req: NextApiRequest, res: NextApiResponse) {
  // Parse and validate query parameters
  const parseResult = GetUserQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parseResult.error.issues,
    });
  }

  const { id, email } = parseResult.data;

  // Either ID or email is required
  if (!id && !email) {
    return res
      .status(400)
      .json({ error: "Either User ID or email is required" });
  }

  try {
    // Connect to MongoDB using mongoose
    await connectDB();

    let user = null;

    // Try to find by ID if provided
    if (id) {
      console.log("Attempting to find user with ID:", id);

      // Check if ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log("Invalid ObjectId format:", id);
        return res.status(400).json({ error: "Invalid user ID format" });
      }

      // Find user by ID
      user = await User.findById(id);
    }

    // If not found by ID, try finding by email if provided
    if (!user && email) {
      console.log("Attempting to find user with email:", email);
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return standardized user data
    return res.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio || "",
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      error: "Failed to fetch user data",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the authenticated session directly from the request
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    // Check if the user is authenticated
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Parse and validate request body
    const parseResult = UpdateUserProfileSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: parseResult.error.issues,
      });
    }

    const { id, ...updateData } = parseResult.data;

    // Connect to MongoDB using mongoose
    await connectDB();

    // Check if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Check if the user is trying to update their own profile
    if (session.user.id !== id) {
      return res
        .status(403)
        .json({ error: "You can only update your own profile" });
    }

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return updated user data
    return res.status(200).json({
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        bio: updatedUser.bio || "",
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      error: "Failed to update user data",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
