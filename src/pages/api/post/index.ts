import type { NextApiRequest, NextApiResponse } from 'next';
import Post from '@/db/Post';
import connectDB from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();
  
  if (req.method === 'POST') {
    return POST(req, res);
  } else if (req.method === 'GET') {
    return GET(req, res);
  } else if (req.method === 'PUT') {
    return PUT(req, res);
  } else if (req.method === 'DELETE') {
    return DELETE(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, image, caption } = req.body;
    
    if (!userId || !image) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newPost = new Post({
      userId,
      image,
      caption: caption || '',
      likes: [],
      comments: []
    });
    
    await newPost.save();
    
    return res.status(201).json({ 
      success: true, 
      post: newPost 
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Failed to create post' });
  }
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, userId, limit = 10, skip = 0 } = req.query;
    
    if (id) {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      return res.status(200).json({ post });
    }
    
    if (userId) {
      const posts = await Post.find({ userId })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip));
      
      return res.status(200).json({ posts });
    }
    
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    
    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
}

async function PUT(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { caption, userId, action } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Handle like/unlike action
    if (action === 'like' && userId) {
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
      }
      await post.save();
      return res.status(200).json({ success: true, post });
    }
    
    if (action === 'unlike' && userId) {
      post.likes = post.likes.filter((id: string) => id !== userId);
      await post.save();
      return res.status(200).json({ success: true, post });
    }
    
    if (action === 'comment' && userId) {
      const { comment } = req.body;
      if (!comment) {
        return res.status(400).json({ error: 'Comment text is required' });
      }
      
      post.comments.push({ 
        userId, 
        comment,
        createdAt: new Date() 
      });
      await post.save();
      return res.status(200).json({ success: true, post });
    }
    
    // Update caption
    if (caption !== undefined) {
      post.caption = caption;
      await post.save();
    }
    
    return res.status(200).json({ success: true, post });
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ error: 'Failed to update post' });
  }
}

async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }
    
    const post = await Post.findByIdAndDelete(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
}
