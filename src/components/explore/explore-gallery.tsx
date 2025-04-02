import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import useSWR, { mutate } from "swr";
import { Heart, MessageCircle } from "lucide-react";
import { PostModal } from "@/components/picwall/post-modal";
import { formatTimeAgo } from "@/lib/date-utils";
import { parseAsString, useQueryState } from "nuqs";

// Function to get user image with fallback
const getUserImage = (
  image: string | null | undefined,
  userId: string
): string => {
  if (image) return image;
  return `https://picsum.photos/seed/${userId || "default"}_user/200/200`;
};

// Fetcher for user data
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("An error occurred while fetching data");
  return res.json();
};

interface ExploreGalleryProps {
  posts: any[];
  isLoggedIn: boolean;
  userSession: any;
  onPostUpdate?: (action: string, postId?: string, updatedPost?: any) => void;
}

export function ExploreGallery({
  posts,
  isLoggedIn,
  userSession,
  onPostUpdate,
}: ExploreGalleryProps) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDataCache, setUserDataCache] = useState<Record<string, any>>({});
  const [_, setIsMobile] = useState(false);
  const [columns, setColumns] = useState(4);
  const [localPosts, setLocalPosts] = useState<any[]>(posts);
  const [deletedPostIds, setDeletedPostIds] = useState<Set<string>>(new Set());
  const [editedPosts, setEditedPosts] = useState<Record<string, any>>({});

  // Use nuqs to track modal state in the URL
  const [postIdParam, setPostIdParam] = useQueryState("postId", {
    defaultValue: "",
    history: "push",
  });

  // Reactive approach - update localPosts whenever props, deleted or edited posts change
  useEffect(() => {
    // Start with filtered posts (removing deleted)
    let updatedPosts = posts.filter(post => !deletedPostIds.has(post.id));

    // Apply any edits
    updatedPosts = updatedPosts.map(post => {
      // If this post has an edited version, return the edited version instead
      return editedPosts[post.id] ? { ...post, ...editedPosts[post.id] } : post;
    });

    setLocalPosts(updatedPosts);
  }, [posts, deletedPostIds, editedPosts]);

  // Check if on mobile device and set number of columns
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      if (width < 640) {
        setColumns(2);
      } else if (width < 1024) {
        setColumns(3);
      } else if (width < 1280) {
        setColumns(4);
      } else {
        setColumns(5);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Sort posts by date, newest first - use useMemo to avoid recomputation
  const sortedPosts = useMemo(() => {
    return [...localPosts].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [localPosts]);

  // Distribute posts into columns (Pinterest style)
  const columnedPosts = useMemo(() => {
    const result: any[][] = Array.from({ length: columns }, () => []);

    sortedPosts.forEach(post => {
      // Add to the shortest column for better distribution
      const shortestColumnIndex = result
        .map((column, i) => ({
          height: column.reduce((sum, p) => sum + (p.aspectRatio || 1), 0),
          index: i,
        }))
        .sort((a, b) => a.height - b.height)[0].index;

      // Calculate a more natural aspect ratio (height/width) from the image dimensions
      // Default to something between 0.8 and 1.5 if no dimensions
      const aspectRatio =
        post.height && post.width
          ? post.height / post.width
          : 0.8 + Math.random() * 0.7; // Random between 0.8 and 1.5

      result[shortestColumnIndex].push({
        ...post,
        aspectRatio,
      });
    });

    return result;
  }, [sortedPosts, columns]);

  // Fetch selected post data when a post is clicked
  const { data: postData } = useSWR(
    selectedPost ? `/api/post?id=${selectedPost.id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Fetch user data for the post author
  const { data: userData } = useSWR(
    selectedPost?.userId ? `/api/user?id=${selectedPost.userId}` : null,
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

  // Extract unique user IDs from comments - use useMemo to prevent recalculation
  const commentUserIds = useMemo(() => {
    return postData?.post?.comments && Array.isArray(postData.post.comments)
      ? [
          ...new Set(
            postData.post.comments
              .map((comment: any) => comment.userId)
              .filter(Boolean)
          ),
        ]
      : [];
  }, [postData?.post?.comments]);

  // Fetch all comment authors at once using the batch endpoint
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
      setUserDataCache(prevCache => {
        const newCache = { ...prevCache };
        commentUsersData.users.forEach((user: any) => {
          newCache[user.id] = user;
        });
        return newCache;
      });
    }
  }, [commentUsersData]); // Remove userDataCache from dependency array

  // Sync the local modal state with the URL parameter
  useEffect(() => {
    if (postIdParam && postIdParam !== "") {
      // Find the post with the matching ID
      const post = posts.find(p => p.id === postIdParam);
      if (post) {
        setSelectedPost(post);
        setIsModalOpen(true);
      }
    } else if (postIdParam === "" && isModalOpen) {
      setIsModalOpen(false);
      setSelectedPost(null);
    }
  }, [postIdParam, posts, isModalOpen]);

  const handlePostClick = useCallback(
    (post: any) => {
      setSelectedPost(post);
      setIsModalOpen(true);
      // Update the URL when opening the modal
      setPostIdParam(post.id);
    },
    [setPostIdParam]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPost(null);
    // Clear the URL parameter when closing the modal
    setPostIdParam("");
  }, [setPostIdParam]);

  // Format post data for the modal - use useMemo to prevent recalculation on every render
  const formattedPost = useMemo(() => {
    if (!postData?.post || !userData?.user) return null;

    return {
      id: postData.post.id,
      userId: postData.post.userId,
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
        Array.isArray(postData.post.likes) && userSession?.user?.id
          ? postData.post.likes.includes(userSession.user.id)
          : false,
    };
  }, [postData, userData, userDataCache, userSession]);

  // Function to revalidate all post-related data
  const revalidateData = useCallback(() => {
    // Revalidate the posts list
    mutate("/api/posts?sort=latest&limit=50");

    // Revalidate the current post if it exists
    if (selectedPost) {
      mutate(`/api/post?id=${selectedPost.id}`);
    }

    // Revalidate user data if needed
    if (selectedPost?.userId) {
      mutate(`/api/user?id=${selectedPost.userId}`);
    }

    // Revalidate comment user data if there are any
    if (commentUserIds.length > 0) {
      mutate(`/api/users?ids=${commentUserIds.join(",")}`);
    }
  }, [selectedPost, commentUserIds]);

  // Enhanced post update handler for handling all operations with reactive UI
  const handlePostUpdate = useCallback(
    (action: string = "update", postId?: string, updatedPostData?: any) => {
      // Handle deletion with optimistic UI update
      if (action === "delete" && postId) {
        // Track deleted posts
        setDeletedPostIds(prev => {
          const newIds = new Set(prev);
          newIds.add(postId);
          return newIds;
        });

        // Close modal if the deleted post is currently selected
        if (selectedPost && selectedPost.id === postId) {
          setIsModalOpen(false);
          setSelectedPost(null);
        }

        // Propagate to parent if provided
        if (onPostUpdate) {
          onPostUpdate(action, postId);
        }
      }

      // Handle edit with optimistic UI update
      else if (action === "edit" && postId && updatedPostData) {
        // Store the edited version
        setEditedPosts(prev => ({
          ...prev,
          [postId]: updatedPostData,
        }));

        // If this post is currently selected, update its data in the modal
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost((prev: any) => ({ ...prev, ...updatedPostData }));
        }

        // Propagate to parent if provided
        if (onPostUpdate) {
          onPostUpdate(action, postId, updatedPostData);
        }
      }

      // Handle all operations through revalidation for consistency
      revalidateData();
    },
    [revalidateData, selectedPost, onPostUpdate]
  );

  return (
    <>
      <div className="flex gap-3 w-full">
        {columnedPosts.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-3 flex-1">
            {column.map((post: any) => (
              <div
                key={post.id}
                className="relative w-full overflow-hidden rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer group"
                style={{ marginBottom: "12px" }}
                onClick={() => handlePostClick(post)}
              >
                <div
                  style={{
                    paddingBottom: `${(post.aspectRatio || 1) * 100}%`,
                    backgroundColor: "#212121",
                  }}
                  className="relative"
                >
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt={
                      post.caption
                        ? post.caption.substring(0, 50)
                        : "Post image"
                    }
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  />

                  {/* Pinterest-style overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {typeof post.likes === "number"
                            ? post.likes
                            : Array.isArray(post.likes)
                              ? post.likes.length
                              : 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {typeof post.comments === "number"
                            ? post.comments
                            : Array.isArray(post.comments)
                              ? post.comments.length
                              : 0}
                        </span>
                      </div>
                    </div>
                    {post.caption && (
                      <p className="text-white text-sm line-clamp-2 mt-2">
                        {post.caption.substring(0, 80)}
                        {post.caption.length > 80 ? "..." : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {sortedPosts.length === 0 && (
        <div className="flex justify-center items-center h-40">
          <p className="text-zinc-400">Loading posts...</p>
        </div>
      )}

      {isModalOpen && formattedPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          post={formattedPost}
          isLoggedIn={isLoggedIn}
          onPostUpdate={(action, postId) => {
            // Handle the update through our main handler
            handlePostUpdate(action, postId);
          }}
        />
      )}
    </>
  );
}
