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
  - **Progressive Web App (PWA)** - install as a mobile application

## Mobile Application

PicWall can be installed as a mobile application on your device:

### Installation Options

1. **Direct Download**:

   - Download the APK from [Google Drive](https://drive.google.com/file/d/1witkgh0CJG97mUzFZW081Uohl90pHOIi/view?usp=sharing)
   - Open the APK file on your Android device to install

2. **Install from Browser** (PWA):
   - Visit the PicWall website on your mobile device
   - For iOS: Tap the Share button, then "Add to Home Screen"
   - For Android: Tap the menu button, then "Install App" or "Add to Home Screen"

Using the PWA version provides an app-like experience with offline capabilities and faster loading times.

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

## API Documentation

### Authentication Endpoints

- **POST /api/auth/\[...all\]**
  - Handles all authentication operations via better-auth
  - Supports login, registration, OAuth callbacks, session management
  - Returns JWT token for authenticated requests

### User Endpoints

- **GET /api/user**

  - **Query Parameters**:
    - `id`: User ID (string)
    - `email`: User email (string)
  - **Response**: User object with profile information
  - **Authentication**: Not required

- **PUT /api/user**

  - **Body**:
    - `id`: User ID (string, required)
    - `name`: Updated name (string, optional)
    - `bio`: Updated bio (string, optional)
    - `image`: Updated profile image URL (string, optional)
  - **Response**: Updated user object
  - **Authentication**: Required (can only update own profile)

- **GET /api/users**
  - **Query Parameters**:
    - `ids`: Comma-separated list of user IDs
  - **Response**: Array of user objects
  - **Authentication**: Not required

### Post Endpoints

- **GET /api/posts**

  - **Query Parameters**:
    - `limit`: Number of posts to return (default: 50)
    - `skip`: Number of posts to skip for pagination (default: 0)
    - `userId`: Filter posts by user ID (optional)
    - `sort`: Sort order, either "latest" or "popular" (default: "latest")
  - **Response**: Array of posts with pagination info
  - **Authentication**: Not required

- **GET /api/post**

  - **Query Parameters**:
    - `id`: Post ID (optional)
    - `userId`: User ID to filter posts by (optional)
    - `limit`: Number of posts to return (default: 10)
    - `skip`: Number of posts to skip for pagination (default: 0)
  - **Response**: Single post or array of posts
  - **Authentication**: Not required

- **POST /api/post**

  - **Body**:
    - `userId`: ID of the post creator (string, required)
    - `image`: Image URL (string, required)
    - `caption`: Post caption (string, optional)
  - **Response**: Created post object
  - **Authentication**: Required

- **PUT /api/post**

  - **Query Parameters**:
    - `id`: Post ID to update
  - **Body**:
    - `caption`: Updated caption (optional)
    - `userId`: User ID making the request (required)
    - `action`: Action to perform: "like", "unlike", or "comment" (optional)
    - `comment`: Comment text (required if action is "comment")
  - **Response**: Updated post object
  - **Authentication**: Required

- **DELETE /api/post**
  - **Query Parameters**:
    - `id`: Post ID to delete
  - **Body**:
    - `userId`: User ID making the request (required)
  - **Response**: Success message
  - **Authentication**: Required (can only delete own posts)

### Upload Endpoints

- **POST /api/upload**
  - **Body**:
    - `image`: Base64 encoded image data
  - **Response**: Uploaded image URL
  - **Authentication**: Required
  - **Limits**: 10MB maximum file size

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

## Testing

This project includes comprehensive end-to-end tests using Playwright. The tests cover all major user flows including:

- Authentication (login, signup, logout)
- Post creation and interaction (creating, viewing, liking, commenting)
- Navigation and UI functionality
- End-to-end user journey

### Running Tests

To run the tests, first make sure you have installed the dependencies:

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

Then you can run the tests using one of the following commands:

```bash
# Run all tests
npm test

# Run tests with UI mode (for visual debugging)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run specific test suites
npm run test:e2e    # End-to-end flow
npm run test:auth   # Authentication tests
npm run test:posts  # Post functionality tests
npm run test:nav    # Navigation tests
```

### Test Files

The tests are located in the `tests` directory:

- `tests/utils.ts` - Utility functions for common test operations
- `tests/auth.spec.ts` - Authentication tests
- `tests/posts.spec.ts` - Post functionality tests
- `tests/navigation.spec.ts` - Navigation and UI tests
- `tests/e2e.spec.ts` - End-to-end user journey test

For more details, see the [tests/README.md](tests/README.md) file.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
