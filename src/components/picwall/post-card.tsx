"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle } from "lucide-react";
import { PostModal } from "./post-modal";
import { useSession } from "@/lib/auth-client";
import { formatTimeAgo } from "@/lib/date-utils";

interface Comment {
  username: string;
  comment: string;
  timeAgo?: string;
  userImage?: string;
}

interface PostCardProps {
  id: string;
  username: string;
  userImage: string;
  timeAgo: string;
  image: string;
  likes: number;
  caption: string;
  comments: Comment[];
  isLoggedIn: boolean;
  liked?: boolean;
}

// Use email as username without formatting
const formatUsername = (email: string): string => {
  return email;
};

// Function to get user image with fallback
const getUserImage = (image: string | undefined, username: string): string => {
  if (image) return image;
  // Create a deterministic seed from the username
  const seed = username ? username.replace(/[^a-zA-Z0-9]/g, "") : "default";
  return `https://picsum.photos/seed/${seed}_user/200/200`;
};

// Function to get fallback avatar image
const getAvatarFallback = (username: string): string => {
  return username
    ? formatUsername(username).substring(0, 2).toUpperCase()
    : "US";
};

export function PostCard({
  id,
  username,
  userImage,
  timeAgo,
  image,
  likes,
  caption,
  comments,
  isLoggedIn,
  liked = false,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(liked);
  const [likesCount, setLikesCount] = useState(likes);
  const [isSaved, setIsSaved] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const { data: session } = useSession();
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Check if we're on a mobile device
  useState(() => {
    if (typeof window !== "undefined") {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Initial check
      checkIfMobile();

      // Add event listener for window resize
      window.addEventListener("resize", checkIfMobile);

      // Cleanup
      return () => window.removeEventListener("resize", checkIfMobile);
    }
  });

  const displayedComments = showAllComments
    ? localComments
    : localComments.slice(0, 2);

  const handleLike = async () => {
    if (!isLoggedIn || !session?.user?.id) {
      // Redirect to login or show login modal
      return;
    }

    // Optimistically update UI
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => (wasLiked ? prev - 1 : prev + 1));

    try {
      const action = wasLiked ? "unlike" : "like";
      const response = await fetch(`/api/post?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          userId: session.user.id,
          action,
        }),
      });

      if (!response.ok) {
        // If the request failed, revert the optimistic update
        setIsLiked(wasLiked);
        setLikesCount(prev => (wasLiked ? prev + 1 : prev - 1));
        console.error("Failed to update like status");
      }
    } catch (error) {
      // If there was an error, revert the optimistic update
      setIsLiked(wasLiked);
      setLikesCount(prev => (wasLiked ? prev + 1 : prev - 1));
      console.error("Error updating like status:", error);
    }
  };

  const handleComment = async () => {
    if (!isLoggedIn || !session?.user?.id || !commentText.trim()) {
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/post?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          userId: session.user.id,
          action: "comment",
          comment: commentText,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Debug latest comment object
        if (
          result.post &&
          result.post.comments &&
          result.post.comments.length > 0
        ) {
          const latestComment =
            result.post.comments[result.post.comments.length - 1];
          console.log("Latest comment from API:", latestComment);
          console.log("Comment createdAt:", latestComment.createdAt);
        }

        // Use the user's email as the username for new comments
        const userEmail = session?.user?.email || username;

        // If we have the full post data with the new comment
        if (
          result.post &&
          result.post.comments &&
          result.post.comments.length > 0
        ) {
          // Get the latest comment which should be the one we just added
          const latestComment =
            result.post.comments[result.post.comments.length - 1];

          // Add the new comment to the local state with proper timestamp from the server
          const newComment = {
            username: userEmail,
            comment: commentText,
            // Calculate timeAgo from createdAt
            timeAgo: latestComment.createdAt
              ? formatTimeAgo(new Date(latestComment.createdAt))
              : formatTimeAgo(new Date()),
          };
          setLocalComments(prev => [...prev, newComment]);
        } else {
          // Fallback in case we don't get the expected response structure
          const newComment = {
            username: userEmail,
            comment: commentText,
            timeAgo: formatTimeAgo(new Date()),
          };
          setLocalComments(prev => [...prev, newComment]);
        }

        setCommentText("");

        // If currently showing a limited number of comments, show them all now
        if (!showAllComments && localComments.length >= 2) {
          setShowAllComments(true);
        }
      } else {
        console.error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formattedCaption = caption.split(" ").map((word, index) => {
    if (word.startsWith("#")) {
      return (
        <>
          {isLoggedIn ? (
            <Link
              key={index}
              href={`/explore/tags/${word.substring(1)}`}
              className="text-blue-400 hover:underline"
            >
              {word}{" "}
            </Link>
          ) : (
            <span className="text-blue-400 cursor-default">{word} </span>
          )}
        </>
      );
    }
    return word + " ";
  });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-zinc-900 rounded-md overflow-hidden border border-zinc-800 w-full">
        {/* Post header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border border-zinc-700">
              <AvatarImage src={userImage} alt={username} />
              <AvatarFallback>
                {formatUsername(username).substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              {isLoggedIn ? (
                <Link
                  href={`/profile/${username}`}
                  className="text-sm font-medium hover:underline"
                >
                  {formatUsername(username)}
                </Link>
              ) : (
                <span className="text-sm font-medium cursor-default">
                  {formatUsername(username)}
                </span>
              )}
              <span className="text-xs text-zinc-500">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Post image - Added click handler to open modal */}
        <div
          className="relative aspect-square cursor-pointer"
          onClick={openModal}
        >
          <Image
            src={image || "/placeholder.svg"}
            alt={`Post by ${formatUsername(username)}`}
            fill
            className="object-cover"
          />
        </div>

        {/* Post actions */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full ${isMobile ? "h-8 w-8" : ""}`}
                onClick={handleLike}
                disabled={!isLoggedIn}
              >
                <Heart
                  className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} ${
                    isLiked ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                <span className="sr-only">Like</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full ${isMobile ? "h-8 w-8" : ""}`}
                onClick={() => {
                  openModal();
                  // Focus comment input after modal opens
                  setTimeout(() => {
                    if (commentInputRef.current) {
                      commentInputRef.current.focus();
                    }
                  }, 300);
                }}
                disabled={!isLoggedIn}
              >
                <MessageCircle
                  className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`}
                />
                <span className="sr-only">Comment</span>
              </Button>
            </div>
          </div>

          {/* Likes */}
          <div className="mb-2">
            <p
              className={`${
                isMobile ? "text-xs" : "text-sm"
              } font-semibold text-white`}
            >
              {likesCount.toLocaleString()} likes
            </p>
          </div>

          {/* Caption */}
          <div className="mb-2">
            <p
              className={`${
                isMobile ? "text-xs leading-normal" : "text-sm"
              } text-white`}
            >
              <Link
                href={isLoggedIn ? `/profile/${username}` : "/login"}
                className="font-semibold mr-1 hover:underline text-white"
              >
                {formatUsername(username)}
              </Link>
              <span className="text-white">{formattedCaption}</span>
            </p>
          </div>

          {/* Comments */}
          {localComments.length > 0 && (
            <div className="space-y-1">
              {localComments.length > 2 && !showAllComments && (
                <button
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } text-zinc-500 hover:text-zinc-400`}
                  onClick={() => setShowAllComments(true)}
                >
                  View all {localComments.length} comments
                </button>
              )}

              {displayedComments.map((comment, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${isMobile ? "py-1" : ""}`}
                >
                  {/* Show avatar in both mobile and desktop */}
                  <Avatar
                    className={`${
                      isMobile ? "w-6 h-6" : "w-7 h-7"
                    } border border-zinc-700 flex-shrink-0`}
                  >
                    <AvatarImage
                      src={
                        comment.userImage ||
                        getUserImage(undefined, comment.username)
                      }
                      alt={comment.username}
                    />
                    <AvatarFallback>
                      {getAvatarFallback(comment.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div
                      className={`${
                        isMobile ? "text-xs" : "text-sm"
                      } text-white`}
                    >
                      <Link
                        href={
                          isLoggedIn ? `/profile/${comment.username}` : "/login"
                        }
                        className="font-semibold mr-1 hover:underline text-white"
                      >
                        {formatUsername(comment.username)}
                      </Link>
                      <span className="break-words text-white">
                        {comment.comment}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 block mt-1">
                      {comment.timeAgo || "recently"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment - only shown if logged in */}
          {isLoggedIn ? (
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                className={`bg-transparent border-none ${
                  isMobile ? "text-xs" : "text-sm"
                } h-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-zinc-500`}
                disabled={isSubmittingComment}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className={`text-blue-400 hover:text-blue-300 ${
                  isMobile ? "text-xs" : "text-sm"
                } ${
                  !commentText.trim() || isSubmittingComment ? "opacity-50" : ""
                }`}
              >
                {isSubmittingComment ? "Posting..." : "Post"}
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <Link
                href="/login"
                className={`${
                  isMobile ? "text-xs" : "text-sm"
                } text-blue-400 hover:text-blue-300`}
              >
                Log in
              </Link>
              <span
                className={`${isMobile ? "text-xs" : "text-sm"} text-zinc-500`}
              >
                {" "}
                to see real posts from users.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Post Modal */}
      <PostModal
        isOpen={isModalOpen}
        onClose={closeModal}
        post={{
          id,
          username,
          userImage,
          timeAgo,
          image: image || "/placeholder.svg",
          likes: likesCount,
          caption,
          comments: localComments,
          liked: isLiked,
        }}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
