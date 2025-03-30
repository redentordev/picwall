export interface Post {
  id: string;
  userId?: string;
  image: string;
  likes: number | string[];
  comments: number | Comment[];
  caption: string;
  createdAt?: string | Date;
  timeAgo?: string;
}

export interface Comment {
  userId: string;
  comment: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  emailVerified?: boolean;
}
