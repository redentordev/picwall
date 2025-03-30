import mongoose, { Document, Schema } from 'mongoose';

interface IComment {
  userId: string;
  comment: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
  userId: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.timeAgo = getTimeAgo(doc.createdAt);
      return ret;
    }
  }
});

export interface IPost extends Document {
  id: string;
  userId: string;
  image: string;
  likes: string[];
  caption: string;
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: String, required: true },
    image: { type: String, required: true },
    likes: { type: [String], default: [] },
    caption: { type: String, default: '' },
    comments: [CommentSchema]
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        ret.timeAgo = getTimeAgo(doc.createdAt);
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'just now';
  if (diffInHours === 1) return '1h';
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1d';
  if (diffInDays < 7) return `${diffInDays}d`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return '1w';
  
  return `${diffInWeeks}w`;
}

const Post = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
