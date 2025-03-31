import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import useSWR from "swr";
import { Post, User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PostModal } from "@/components/picwall/post-modal";
import { useSession } from "@/lib/auth-client";
import { formatTimeAgo } from "@/lib/date-utils";

// SWR fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("An error occurred while fetching data");
  return res.json();
};

// Function to get user image with fallback
const getUserImage = (
  image: string | null | undefined,
  userId: string
): string => {
  if (image) return image;
  return `https://picsum.photos/seed/${userId || "default"}_user/200/200`;
};

interface ProfileGalleryProps {
  posts: Post[];
  isLoading: boolean;
}

export function ProfileGallery({ posts, isLoading }: ProfileGalleryProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const [userDataCache, setUserDataCache] = useState<Record<string, User>>({});

  // Fetch selected post data using SWR when a post is clicked
  const { data: postData } = useSWR(
    selectedPostId ? `/api/post?id=${selectedPostId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Fetch user data for the post author
  const { data: userData } = useSWR(
    postData?.post?.userId ? `/api/user?id=${postData.post.userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  // Add post author to cache if available
  useEffect(() => {
    if (userData?.user) {
      setUserDataCache(prev => ({
        ...prev,
        [userData.user.id]: userData.user,
      }));
    }
  }, [userData]);

  // Extract unique user IDs from comments
  const commentUserIds =
    postData?.post?.comments && Array.isArray(postData.post.comments)
      ? [
          ...new Set(
            postData.post.comments
              .map((comment: any) => comment.userId)
              .filter(Boolean)
          ),
        ]
      : [];

  // Fetch all comment authors at once using the new batch endpoint
  const { data: commentUsersData } = useSWR(
    commentUserIds.length > 0
      ? `/api/users?ids=${commentUserIds.join(",")}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  // Add comment authors to cache if available
  useEffect(() => {
    if (commentUsersData?.users && Array.isArray(commentUsersData.users)) {
      const newCache = { ...userDataCache };
      commentUsersData.users.forEach((user: User) => {
        newCache[user.id] = user;
      });
      setUserDataCache(newCache);
    }
  }, [commentUsersData]);

  // Format post data for the modal
  const formattedPost =
    postData?.post && userData?.user
      ? {
          id: postData.post.id,
          username: userData.user.email || "",
          userImage: getUserImage(userData.user.image, userData.user.id),
          timeAgo: postData.post.createdAt
            ? formatTimeAgo(new Date(postData.post.createdAt))
            : "recently",
          image: postData.post.image || "",
          likes:
            typeof postData.post.likes === "number"
              ? postData.post.likes
              : Array.isArray(postData.post.likes)
              ? postData.post.likes.length
              : 0,
          caption: postData.post.caption || "",
          comments: Array.isArray(postData.post.comments)
            ? postData.post.comments.map((comment: any) => {
                const commentUser = userDataCache[comment.userId];
                return {
                  username: commentUser?.email || "user",
                  comment: comment.comment || "",
                  timeAgo: comment.createdAt
                    ? formatTimeAgo(new Date(comment.createdAt))
                    : "recently",
                  userImage: commentUser?.image
                    ? commentUser.image
                    : getUserImage(null, comment.userId),
                };
              })
            : [],
          liked:
            Array.isArray(postData.post.likes) && session?.user?.id
              ? postData.post.likes.includes(session.user.id)
              : false,
        }
      : null;

  const handlePostClick = (post: Post) => {
    setSelectedPostId(post.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPostId(null);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative aspect-square">
              <Skeleton className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
        <p className="text-zinc-400 text-center max-w-md">
          When this user shares photos, you&apos;ll see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts.map(post => (
          <div
            key={post.id}
            className="relative aspect-square group cursor-pointer"
            onClick={() => handlePostClick(post)}
          >
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {typeof post.likes === "number"
                      ? post.likes
                      : Array.isArray(post.likes)
                      ? post.likes.length
                      : 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {Array.isArray(post.comments) ? post.comments.length : 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.caption || "Post"}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {isLoggedIn && selectedPostId && formattedPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          post={formattedPost}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}
