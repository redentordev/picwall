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
import { Heart, MessageCircle, X, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { formatTimeAgo } from "@/lib/date-utils";

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
}

// Use email as username without formatting
const formatUsername = (email: string): string => {
  return email;
};

export function PostModal({
  isOpen,
  onClose,
  post,
  isLoggedIn,
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

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Handle drag start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!commentPanelRef.current) return;
    dragStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
    commentPanelRef.current.style.transition = "none";
  };

  // Handle drag movement
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null || !commentPanelRef.current) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;

    // Only allow dragging downward
    if (deltaY < 0) return;

    currentTranslateY.current = deltaY;
    commentPanelRef.current.style.transform = `translateY(${deltaY}px)`;
  };

  // Handle drag end
  const handleTouchEnd = () => {
    if (!commentPanelRef.current || dragStartY.current === null) return;

    commentPanelRef.current.style.transition = "transform 0.3s ease-in-out";

    // If dragged more than 100px down, close the panel
    if (currentTranslateY.current > 100) {
      setShowComments(false);
    } else {
      // Otherwise snap back
      commentPanelRef.current.style.transform = "translateY(0)";
    }

    dragStartY.current = null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[80vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-6xl p-0 bg-zinc-900 border border-zinc-800 overflow-hidden rounded-lg">
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
            <div className="flex flex-col h-full">
              {/* Post header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 border border-zinc-700">
                    <AvatarImage src={post.userImage} alt={post.username} />
                    <AvatarFallback>
                      {formatUsername(post.username)
                        .substring(0, 2)
                        .toUpperCase()}
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

              {/* Comments section */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Original post caption */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 border border-zinc-700">
                    <AvatarImage src={post.userImage} alt={post.username} />
                    <AvatarFallback>
                      {formatUsername(post.username)
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      <Link
                        href={`/profile/${post.username}`}
                        className="font-semibold mr-1 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {formatUsername(post.username)}
                      </Link>
                      {formattedCaption}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{post.timeAgo}</p>
                  </div>
                </div>

                {/* Comments */}
                {localComments.map((comment, index) => (
                  <div key={index} className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-zinc-700">
                      <AvatarImage
                        src={
                          comment.userImage ||
                          `/images/avatars/${comment.username}.jpg`
                        }
                        alt={comment.username}
                      />
                      <AvatarFallback>
                        {formatUsername(comment.username)
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        <Link
                          href={`/profile/${comment.username}`}
                          className="font-semibold mr-1 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {formatUsername(comment.username)}
                        </Link>
                        {comment.comment}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {comment.timeAgo || "recently"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Post actions */}
              <div className="border-t border-zinc-800 p-4">
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
                      className="bg-transparent border-none text-sm h-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
          <div className="flex flex-col h-[85vh]">
            {/* Username bar */}
            <div className="flex items-center p-3 border-b border-zinc-800">
              <Avatar className="w-7 h-7 border border-zinc-700 mr-2">
                <AvatarImage src={post.userImage} alt={post.username} />
                <AvatarFallback>
                  {formatUsername(post.username).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/profile/${post.username}`}
                className="text-sm font-medium hover:underline"
                onClick={e => e.stopPropagation()}
              >
                {formatUsername(post.username)}
              </Link>
            </div>

            {/* Image container */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              <Image
                src={post.image || "/placeholder.svg"}
                alt={`Post by ${post.username}`}
                fill
                className="object-contain"
              />
            </div>

            {/* Action bar */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={toggleComments}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="sr-only">Comment</span>
                  </Button>
                </div>
                <p className="text-xs font-semibold">
                  {likesCount.toLocaleString()} likes
                </p>
              </div>
            </div>

            {/* Comment overlay panel */}
            <div
              ref={commentPanelRef}
              className={cn(
                "fixed inset-x-0 bottom-0 bg-zinc-900 rounded-t-xl shadow-lg z-10 transition-transform duration-300 ease-in-out transform",
                showComments ? "translate-y-0" : "translate-y-full"
              )}
              style={{
                maxHeight: "70vh",
                height: "70vh",
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Pull indicator */}
              <div
                className="flex justify-center p-2 cursor-grab active:cursor-grabbing"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>

              {/* Comments header */}
              <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold">Comments</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={toggleComments}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close comments</span>
                </Button>
              </div>

              {/* Comment list */}
              <div
                className="overflow-y-auto p-3 space-y-4"
                style={{ maxHeight: "calc(70vh - 125px)" }}
              >
                {/* Caption */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 border border-zinc-700">
                    <AvatarImage src={post.userImage} alt={post.username} />
                    <AvatarFallback>
                      {formatUsername(post.username)
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      <Link
                        href={`/profile/${post.username}`}
                        className="font-semibold mr-1 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {formatUsername(post.username)}
                      </Link>
                      {formattedCaption}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{post.timeAgo}</p>
                  </div>
                </div>

                {/* Comments */}
                {localComments.map((comment, index) => (
                  <div key={index} className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-zinc-700">
                      <AvatarImage
                        src={
                          comment.userImage ||
                          `/images/avatars/${comment.username}.jpg`
                        }
                        alt={comment.username}
                      />
                      <AvatarFallback>
                        {formatUsername(comment.username)
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        <Link
                          href={`/profile/${comment.username}`}
                          className="font-semibold mr-1 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {formatUsername(comment.username)}
                        </Link>
                        {comment.comment}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {comment.timeAgo || "recently"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              {isLoggedIn ? (
                <div className="p-3 border-t border-zinc-800">
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
                      className="bg-transparent border-none text-sm h-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                </div>
              ) : (
                <div className="p-3 border-t border-zinc-800">
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
