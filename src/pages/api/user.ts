import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// Use the same MongoDB client as better-auth
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/picwall';

// This is a simplified API endpoint for development/demo purposes
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Connect to MongoDB directly
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Check for the list parameter
    if (req.query.list === 'true') {
      console.log('LIST MODE: Getting all users');
      
      // Get all users from both collections
      const usersFromUser = await db.collection('user').find({}).toArray();
      const usersFromUsers = await db.collection('users').find({}).toArray();
      
      // Prepare simplified user list
      const userList = [
        ...usersFromUser.map(user => ({
          id: user._id,
          email: user.email,
          name: user.name,
          collection: 'user'
        })),
        ...usersFromUsers.map(user => ({
          id: user._id,
          email: user.email,
          name: user.name,
          collection: 'users'
        }))
      ];
      
      // Return the list
      await client.close();
      return res.status(200).json({ users: userList });
    }
    
    // Check for the debug parameter
    if (req.query.debug === 'true') {
      console.log('DEBUG MODE: Examining collection structure');
      
      // List all collections
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      // Examine user collections
      const userSample = await db.collection('user').findOne({});
      console.log('Sample from user collection:', userSample);
      
      const usersSample = await db.collection('users').findOne({});
      console.log('Sample from users collection:', usersSample);
      
      // Return the debug information
      await client.close();
      return res.status(200).json({
        collections: collections.map(c => c.name),
        userSample,
        usersSample
      });
    }
    
    // Get user ID or email from query
    const { id, email } = req.query;
    
    // Either ID or email is required
    if (!id && !email) {
      return res.status(400).json({ error: 'Either User ID or email is required' });
    }
    
    let user = null;
    
    // Try to find by ID if provided
    if (id) {
      console.log('Attempting to find user with ID:', id);
      
      // Check if ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id.toString())) {
        console.log('Invalid ObjectId format:', id);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      // Try to find user in the user collection (used by better-auth)
      user = await db.collection('user').findOne({
        _id: new mongoose.Types.ObjectId(id.toString())
      });
      
      console.log('User query result from "user" collection:', user);
      
      // If not found, try 'users' collection as a fallback
      if (!user) {
        console.log('User not found in "user" collection, trying "users"');
        user = await db.collection('users').findOne({
          _id: new mongoose.Types.ObjectId(id.toString())
        });
        
        console.log('Result from "users" collection:', user);
      }
    }
    
    // If not found by ID, try finding by email if provided
    if (!user && email) {
      console.log('Attempting to find user with email:', email);
      
      // Try to find in user collection
      user = await db.collection('user').findOne({ email });
      console.log('User query result by email from "user" collection:', user);
      
      // If not found, try 'users' collection
      if (!user) {
        console.log('User not found by email in "user" collection, trying "users"');
        user = await db.collection('users').findOne({ email });
        console.log('Result by email from "users" collection:', user);
      }
    }
      
    if (!user) {
      console.log('User not found in any collection, returning fallback');
      await client.close();
      
      // Create a fallback user ID if none provided
      const fallbackId = id || 'unknown';
      
      // User not found, return a fallback response
      return res.status(200).json({
        user: {
          id: fallbackId,
          email: email || `user_${fallbackId.toString().slice(-4)}@example.com`,
          name: `User ${fallbackId.toString().slice(-4)}`,
        }
      });
    }
    
    // Found a user, prepare response
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
    };
    
    console.log('Returning user data:', userData);
    
    await client.close();
    return res.status(200).json({ user: userData });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user data', details: error instanceof Error ? error.message : String(error) });
  }
} 