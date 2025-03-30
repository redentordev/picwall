# PicWall - Image Sharing Platform

PicWall is a modern image sharing platform built with Next.js where users can share photos, explore content, like posts, and interact with other users.

## Features

- **User Authentication**

  - Login with email/password
  - Social logins (GitHub, Google)
  - User profiles

- **Image Sharing**

  - Upload and share images
  - Add captions to posts
  - Like and comment on posts

- **Explore Feed**

  - Infinite scrolling feed of images
  - Discover content from other users

- **Responsive Design**
  - Works on mobile, tablet, and desktop devices
  - Optimized UI for different screen sizes

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- MongoDB database (or MongoDB Atlas account)
- AWS S3 bucket for image storage
- OAuth credentials (GitHub, Google) for social login

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3000

# MongoDB connection
MONGODB_URI=your_mongodb_connection_string

# Authentication
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_BASE_URL=http://localhost:3000

# GitHub OAuth
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AWS S3 configuration
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
```

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### Account Creation

1. Navigate to the login page
2. Choose to sign up with email or use social login
3. Complete your profile setup

### Posting Images

1. Click the "+" button in the feed
2. Upload an image from your device
3. Add a caption (optional)
4. Submit your post

### Interacting with Content

- Like posts by clicking the heart icon
- Add comments to engage with other users
- Explore new content in the discover feed

## Development

### Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API routes, MongoDB/Mongoose
- **Authentication**: better-auth
- **Storage**: AWS S3 for image uploads
- **Deployment**: Easily deployable on Vercel

### Building for Production

```bash
npm run build
# or
yarn build
```

### Starting Production Server

```bash
npm run start
# or
yarn start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
