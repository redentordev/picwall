"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Heart, MessageCircle, X, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { formatTimeAgo } from "@/lib/date-utils";
import { mutate } from "swr";

interface Comment {
  username: string;
  comment: string;
  timeAgo?: string;
  userImage?: string;
}

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    username: string;
    userImage: string;
    timeAgo: string;
    image: string;
    likes: number;
    caption: string;
    comments: Comment[];
    liked?: boolean;
  };
  isLoggedIn: boolean;
  onPostUpdate?: () => void;
}

// Use email as username without formatting
const formatUsername = (email: string): string => {
  return email;
};

// Function to get fallback avatar image
const getAvatarFallback = (username: string): string => {
  return username
    ? formatUsername(username).substring(0, 2).toUpperCase()
    : "US";
};

// Function to get user image with fallback
const getUserImage = (image: string | undefined, username: string): string => {
  if (image) return image;
  // Create a deterministic seed from the username
  const seed = username ? username.replace(/[^a-zA-Z0-9]/g, "") : "default";
  return `https://picsum.photos/seed/${seed}_user/200/200`;
};

export function PostModal({
  isOpen,
  onClose,
  post,
  isLoggedIn,
  onPostUpdate,
}: PostModalProps) {
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const commentPanelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef<number>(0);
  const { data: session } = useSession();

  // Interaction state
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [localComments, setLocalComments] = useState<Comment[]>(post.comments);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Update local state when post props change
  useEffect(() => {
    setIsLiked(post.liked || false);
    setLikesCount(post.likes);
    setLocalComments(post.comments);
  }, [post.liked, post.likes, post.comments]);

  // Check if we're on a mobile device
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkIfMobile = () => {
        const isMobileView = window.innerWidth < 768;
        setIsMobile(isMobileView);
        // If transitioning from mobile to desktop, ensure comments are visible
        if (!isMobileView) {
          setShowComments(false);
        }
      };

      // Initial check
      checkIfMobile();

      // Add event listener for window resize
      window.addEventListener("resize", checkIfMobile);

      // Cleanup
      return () => window.removeEventListener("resize", checkIfMobile);
    }
  }, []);

  // Reset comments panel state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setShowComments(false);
    }
  }, [isOpen]);

  // Focus the comment input when the comment section opens
  useEffect(() => {
    if (
      isOpen &&
      isLoggedIn &&
      showComments &&
      commentInputRef.current &&
      isMobile
    ) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isLoggedIn, showComments, isMobile]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showComments && isMobile) {
          setShowComments(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, showComments, isMobile]);

  // Function to revalidate data
  const revalidateData = () => {
    // Revalidate the current post
    mutate(`/api/post?id=${post.id}`);

    // Call the parent's revalidation function if provided
    if (onPostUpdate) {
      onPostUpdate();
    }
  };

  // Handle liking a post
  const handleLike = async () => {
    if (!isLoggedIn || !session?.user?.id) return;

    // Optimistically update UI
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => (wasLiked ? prev - 1 : prev + 1));

    try {
      const action = wasLiked ? "unlike" : "like";
      const response = await fetch(`/api/post?id=${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: post.id,
          userId: session.user.id,
          action,
        }),
      });

      if (response.ok) {
        // Revalidate data after successful update
        revalidateData();
      } else {
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

  // Handle commenting on a post
  const handleComment = async () => {
    if (!isLoggedIn || !session?.user?.id || !commentText.trim()) return;

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/post?id=${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: post.id,
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
          console.log("Latest comment from API (modal):", latestComment);
          console.log("Comment createdAt (modal):", latestComment.createdAt);
        }

        // Use the user's email as the username for the new comment
        const userEmail = session?.user?.email || post.username;

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

        // Revalidate data after successful comment
        revalidateData();
      } else {
        console.error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Format hashtags in caption
  const formattedCaption = post.caption.split(" ").map((word, index) => {
    if (word.startsWith("#")) {
      return (
        <Link
          key={index}
          href={`/explore/tags/${word.substring(1)}`}
          className="text-blue-400 hover:underline"
          onClick={e => e.stopPropagation()}
        >
          {word}{" "}
        </Link>
      );
    }
    return word + " ";
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[80vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-6xl p-0 bg-zinc-900 border border-zinc-800 overflow-hidden rounded-lg max-h-[90vh]">
        <VisuallyHidden>
          <DialogTitle>Post by {formatUsername(post.username)}</DialogTitle>
          <DialogDescription>
            Photo post with image and comments
          </DialogDescription>
        </VisuallyHidden>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-20 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Desktop layout */}
        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-2 h-[80vh] max-h-[80vh]">
            {/* Left side - Image */}
            <div className="relative bg-black flex items-center justify-center h-full">
              <Image
                src={post.image || "/placeholder.svg"}
                alt={`Post by ${post.username}`}
                fill
                className="object-contain"
              />
            </div>

            {/* Right side - Comments and interactions */}
            <div className="flex flex-col h-full max-h-[80vh]">
              {/* Post header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 border border-zinc-700">
                    <AvatarImage src={post.userImage} alt={post.username} />
                    <AvatarFallback>
                      {getAvatarFallback(post.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Link
                      href={`/profile/${post.username}`}
                      className="text-sm font-medium hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {formatUsername(post.username)}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Comments section - Make sure it's scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Original post caption */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 border border-zinc-700 flex-shrink-0">
                    <AvatarImage src={post.userImage} alt={post.username} />
                    <AvatarFallback>
                      {getAvatarFallback(post.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-white">
                      <Link
                        href={`/profile/${post.username}`}
                        className="font-semibold mr-1 hover:underline text-white"
                        onClick={e => e.stopPropagation()}
                      >
                        {formatUsername(post.username)}
                      </Link>
                      <span className="text-white">{formattedCaption}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{post.timeAgo}</p>
                  </div>
                </div>

                {/* Comments */}
                {localComments.map((comment, index) => (
                  <div key={index} className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-zinc-700 flex-shrink-0">
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
                    <div>
                      <p className="text-sm text-white">
                        <Link
                          href={`/profile/${comment.username}`}
                          className="font-semibold mr-1 hover:underline text-white"
                          onClick={e => e.stopPropagation()}
                        >
                          {formatUsername(comment.username)}
                        </Link>
                        <span className="text-white">{comment.comment}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {comment.timeAgo || "recently"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Post actions - Fixed at bottom */}
              <div className="border-t border-zinc-800 p-4 bg-zinc-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={handleLike}
                      disabled={!isLoggedIn}
                    >
                      <Heart
                        className={`h-6 w-6 ${
                          isLiked ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                      <span className="sr-only">Like</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => commentInputRef.current?.focus()}
                    >
                      <MessageCircle className="h-6 w-6" />
                      <span className="sr-only">Comment</span>
                    </Button>
                  </div>
                </div>

                {/* Likes */}
                <div className="mb-3">
                  <p className="text-sm font-semibold">
                    {likesCount.toLocaleString()} likes
                  </p>
                </div>

                {/* Add comment */}
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={commentInputRef}
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
                      className="bg-transparent border-none text-sm h-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-zinc-500"
                      disabled={isSubmittingComment}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleComment}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className={`text-blue-400 hover:text-blue-300 ${
                        !commentText.trim() || isSubmittingComment
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        "Post"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Link
                      href="/login"
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Log in
                    </Link>
                    <span className="text-sm text-zinc-500">
                      {" "}
                      to like or comment.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile layout */}
        {isMobile && (
          <div className="flex flex-col h-[80vh] max-h-[80vh]">
            {/* Username bar */}
            <div className="flex items-center p-3 border-b border-zinc-800 bg-zinc-900 z-10">
              <Avatar className="w-7 h-7 border border-zinc-700 mr-2">
                <AvatarImage src={post.userImage} alt={post.username} />
                <AvatarFallback>
                  {getAvatarFallback(post.username)}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/profile/${post.username}`}
                className="text-sm font-medium hover:underline text-white"
                onClick={e => e.stopPropagation()}
              >
                {formatUsername(post.username)}
              </Link>
            </div>

            {/* Content area with scrolling */}
            <div className="flex flex-col overflow-y-auto flex-1">
              {/* Image container */}
              <div
                className="relative bg-black flex items-center justify-center"
                style={{ minHeight: "200px", height: "40vh" }}
              >
                <Image
                  src={post.image || "/placeholder.svg"}
                  alt={`Post by ${post.username}`}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Caption and comments */}
              <div className="p-3 space-y-4 flex-1 overflow-y-auto">
                {/* Caption */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 border border-zinc-700 flex-shrink-0">
                    <AvatarImage src={post.userImage} alt={post.username} />
                    <AvatarFallback>
                      {getAvatarFallback(post.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-white">
                      <Link
                        href={`/profile/${post.username}`}
                        className="font-semibold mr-1 hover:underline text-white"
                        onClick={e => e.stopPropagation()}
                      >
                        {formatUsername(post.username)}
                      </Link>
                      <span className="text-white">{formattedCaption}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{post.timeAgo}</p>
                  </div>
                </div>

                {/* Comments */}
                {localComments.map((comment, index) => (
                  <div key={index} className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-zinc-700 flex-shrink-0">
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
                    <div>
                      <p className="text-sm text-white">
                        <Link
                          href={`/profile/${comment.username}`}
                          className="font-semibold mr-1 hover:underline text-white"
                          onClick={e => e.stopPropagation()}
                        >
                          {formatUsername(comment.username)}
                        </Link>
                        <span className="text-white">{comment.comment}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {comment.timeAgo || "recently"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action bar - Fixed at bottom */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900 z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handleLike}
                    disabled={!isLoggedIn}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isLiked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    <span className="sr-only">Like</span>
                  </Button>
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold">
                  {likesCount.toLocaleString()} likes
                </p>
              </div>

              {/* Comment input */}
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={commentInputRef}
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
                    className="bg-transparent border-none text-sm h-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-zinc-500"
                    disabled={isSubmittingComment}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                    className={`text-blue-400 hover:text-blue-300 ${
                      !commentText.trim() || isSubmittingComment
                        ? "opacity-50"
                        : ""
                    }`}
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              ) : (
                <div>
                  <Link
                    href="/login"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Log in
                  </Link>
                  <span className="text-sm text-zinc-500">
                    {" "}
                    to like or comment.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
