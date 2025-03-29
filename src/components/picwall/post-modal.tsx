"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Heart, MessageCircle, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  };
  isLoggedIn: boolean;
}

export function PostModal({
  isOpen,
  onClose,
  post,
  isLoggedIn,
}: PostModalProps) {
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showComments, setShowComments] = useState(false);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[80vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-6xl p-0 bg-zinc-900 border border-zinc-800 overflow-hidden rounded-lg">
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
                      {post.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Link
                      href={`/profile/${post.username}`}
                      className="text-sm font-medium hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {post.username}
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
                      {post.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      <Link
                        href={`/profile/${post.username}`}
                        className="font-semibold mr-1 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {post.username}
                      </Link>
                      {formattedCaption}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{post.timeAgo}</p>
                  </div>
                </div>

                {/* Comments */}
                {post.comments.map((comment, index) => (
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
                        {comment.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        <Link
                          href={`/profile/${comment.username}`}
                          className="font-semibold mr-1 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {comment.username}
                        </Link>
                        {comment.comment}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {comment.timeAgo || "1d"}
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
                    >
                      <Heart className="h-6 w-6" />
                      <span className="sr-only">Like</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                    >
                      <MessageCircle className="h-6 w-6" />
                      <span className="sr-only">Comment</span>
                    </Button>
                  </div>
                </div>

                {/* Likes */}
                <div className="mb-3">
                  <p className="text-sm font-semibold">
                    {post.likes.toLocaleString()} likes
                  </p>
                </div>

                {/* Add comment */}
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={commentInputRef}
                      type="text"
                      placeholder="Add a comment..."
                      className="bg-transparent border-none text-sm h-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Post
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Link
                      href="/"
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
                  {post.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/profile/${post.username}`}
                className="text-sm font-medium hover:underline"
                onClick={e => e.stopPropagation()}
              >
                {post.username}
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
                  >
                    <Heart className="h-5 w-5" />
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
                  {post.likes.toLocaleString()} likes
                </p>
              </div>
            </div>

            {/* Comment overlay panel */}
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 bg-zinc-900 rounded-t-xl shadow-lg z-10 transition-transform duration-300 ease-in-out transform",
                showComments ? "translate-y-0" : "translate-y-full"
              )}
              style={{
                maxHeight: "70vh",
                height: "70vh",
              }}
            >
              {/* Pull indicator */}
              <div className="flex justify-center p-2" onClick={toggleComments}>
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
                      {post.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      <Link
                        href={`/profile/${post.username}`}
                        className="font-semibold mr-1 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {post.username}
                      </Link>
                      {formattedCaption}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{post.timeAgo}</p>
                  </div>
                </div>

                {/* Comments */}
                {post.comments.map((comment, index) => (
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
                        {comment.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        <Link
                          href={`/profile/${comment.username}`}
                          className="font-semibold mr-1 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {comment.username}
                        </Link>
                        {comment.comment}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {comment.timeAgo || "1d"}
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
                      className="bg-transparent border-none text-sm h-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Post
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 border-t border-zinc-800">
                  <Link
                    href="/"
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
