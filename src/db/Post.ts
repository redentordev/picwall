import mongoose, { Document, Schema } from "mongoose";

interface IComment {
  userId: string;
  comment: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    userId: { type: String, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // No need to add timeAgo here, we'll calculate it in the frontend
        return ret;
      },
    },
  }
);

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
    caption: { type: String, default: "" },
    comments: [CommentSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        ret.timeAgo = getTimeAgo(doc.createdAt);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();

  // Convert to seconds
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Convert to minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);

  // Less than an hour
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1m" : `${diffInMinutes}m`;
  }

  // Convert to hours
  const diffInHours = Math.floor(diffInMinutes / 60);

  // Less than a day
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1h" : `${diffInHours}h`;
  }

  // Convert to days
  const diffInDays = Math.floor(diffInHours / 24);

  // Less than a week
  if (diffInDays < 7) {
    return diffInDays === 1 ? "1d" : `${diffInDays}d`;
  }

  // Convert to weeks
  const diffInWeeks = Math.floor(diffInDays / 7);

  // Less than a month (roughly)
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1w" : `${diffInWeeks}w`;
  }

  // Convert to months
  const diffInMonths = Math.floor(diffInDays / 30);

  // Less than a year
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1mo" : `${diffInMonths}mo`;
  }

  // Convert to years
  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1y" : `${diffInYears}y`;
}

const Post = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
