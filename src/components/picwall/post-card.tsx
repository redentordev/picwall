"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { PostModal } from "./post-modal";

interface Comment {
  username: string;
  comment: string;
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
}

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
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const displayedComments = showAllComments ? comments : comments.slice(0, 2);

  const handleLike = () => {
    if (!isLoggedIn) {
      // Redirect to login or show login modal
      return;
    }
    setIsLiked(!isLiked);
  };

  const handleSave = () => {
    if (!isLoggedIn) {
      // Redirect to login or show login modal
      return;
    }
    setIsSaved(!isSaved);
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
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              {isLoggedIn ? (
                <Link
                  href={`/profile/${username}`}
                  className="text-sm font-medium hover:underline"
                >
                  {username}
                </Link>
              ) : (
                <span className="text-sm font-medium cursor-default">
                  {username}
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
            alt={`Post by ${username}`}
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
            <p className={`${isMobile ? "text-xs" : "text-sm"} font-semibold`}>
              {likes.toLocaleString()} likes
            </p>
          </div>

          {/* Caption */}
          <div className="mb-2">
            <p className={`${isMobile ? "text-xs leading-normal" : "text-sm"}`}>
              <Link
                href={isLoggedIn ? `/profile/${username}` : "/login"}
                className="font-semibold mr-1 hover:underline"
              >
                {username}
              </Link>
              {formattedCaption}
            </p>
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div className="space-y-1">
              {comments.length > 2 && !showAllComments && (
                <button
                  className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } text-zinc-500 hover:text-zinc-400`}
                  onClick={() => setShowAllComments(true)}
                >
                  View all {comments.length} comments
                </button>
              )}

              {displayedComments.map((comment, index) => (
                <div
                  key={index}
                  className={`${isMobile ? "text-xs" : "text-sm"}`}
                >
                  <Link
                    href={
                      isLoggedIn ? `/profile/${comment.username}` : "/login"
                    }
                    className="font-semibold mr-1 hover:underline"
                  >
                    {comment.username}
                  </Link>
                  {comment.comment}
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
                className={`bg-transparent border-none ${
                  isMobile ? "text-xs" : "text-sm"
                } h-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0`}
              />
              <Button
                variant="ghost"
                size="sm"
                className={`text-blue-400 hover:text-blue-300 ${
                  isMobile ? "text-xs" : "text-sm"
                }`}
              >
                Post
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
          image,
          likes,
          caption,
          comments,
        }}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
