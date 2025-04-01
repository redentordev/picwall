import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/picwall/sidebar";
import { PostCard } from "@/components/picwall/post-card";
import { useSession } from "@/lib/auth-client";
import { faker } from "@faker-js/faker";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { NextSeo } from "next-seo";
import { CreatePostModal } from "@/components/picwall/create-post-modal";
import { formatTimeAgo } from "@/lib/date-utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Create a user cache to store user email information
const userCache = new Map<string, string>();

const generateDummyPosts = (count: number, startIndex: number = 0) => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const id = (index + 1).toString();
    const seed = index + new Date().getTime();
    const email = faker.internet.email().toLowerCase();

    // Generate a random date within the last 30 days
    const randomDate = new Date();
    randomDate.setDate(
      randomDate.getDate() - faker.number.int({ min: 0, max: 30 })
    );
    const timeAgo = formatTimeAgo(randomDate);

    const likes = faker.number.int({ min: 50, max: 5000 });

    const hashtags = [
      "#photography",
      "#inspiration",
      "#picwall",
      "#nature",
      "#travel",
      "#art",
      "#design",
    ];

    const selectedHashtags = faker.helpers.arrayElements(
      hashtags,
      faker.number.int({ min: 1, max: 3 })
    );

    const caption = `${faker.lorem.paragraph(1)} ${selectedHashtags.join(" ")}`;

    const commentCount = faker.number.int({ min: 1, max: 5 });
    const comments = Array.from({ length: commentCount }, () => {
      // Generate a random date for the comment that's newer than the post date
      const commentDate = new Date(randomDate);
      commentDate.setHours(
        commentDate.getHours() + faker.number.int({ min: 1, max: 100 })
      );
      return {
        username: faker.internet.email().toLowerCase(),
        comment: faker.lorem.sentence(),
        timeAgo: formatTimeAgo(commentDate),
      };
    });

    return {
      id,
      username: email,
      userImage: `https://picsum.photos/seed/${seed}/800/800`,
      timeAgo,
      image: `https://picsum.photos/seed/${seed}/800/800`,
      likes,
      caption,
      comments,
      liked: false, // Dummy posts are not liked by default
    };
  });
};

const PAGE_SIZE = 3;

// Function to get the user's email from their ID
// This makes an API call to get user data from our database
const getUserEmailById = async (userId: string): Promise<string> => {
  // Check if we already have the email in our cache
  if (userCache.has(userId)) {
    return userCache.get(userId) as string;
  }

  try {
    // Make an API call to get user data
    const response = await fetch(`/api/user?id=${userId}`);

    if (response.ok) {
      const data = await response.json();
      const email = data.user.email;

      // Cache the result for future use
      userCache.set(userId, email);
      return email;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }

  // Let the API handle the fallback for us
  return `user_${userId.slice(-4)}@example.com`;
};

// Function to get user image with fallback
const getUserImage = (
  image: string | null | undefined,
  userId: string
): string => {
  if (image) return image;
  return `https://picsum.photos/seed/${userId || "default"}_user/200/200`;
};

// New function to fetch multiple users at once
const fetchMultipleUsers = async (
  userIds: string[]
): Promise<Map<string, any>> => {
  if (!userIds.length) return new Map();

  try {
    const response = await fetch(`/api/users?ids=${userIds.join(",")}`);
    if (!response.ok) throw new Error("Failed to fetch users");

    const data = await response.json();
    const userMap = new Map();

    if (data.users && Array.isArray(data.users)) {
      data.users.forEach((user: any) => {
        userMap.set(user.id, user);
        // Also update the email cache
        userCache.set(user.id, user.email);
      });
    }

    return userMap;
  } catch (error) {
    console.error("Error fetching multiple users:", error);
    return new Map();
  }
};

export default function Home() {
  const { data: session } = useSession();
  console.log("session", session);
  const isLoggedIn = !!session;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [deletedPostIds, setDeletedPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();

    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.length) return null;

    // If logged in, fetch from the API, otherwise use the dummy data path
    if (isLoggedIn) {
      return [
        `/api/post?skip=${pageIndex * PAGE_SIZE}&limit=${PAGE_SIZE}`,
        pageIndex,
      ];
    } else {
      return [`/api/dummy-posts`, pageIndex];
    }
  };

  const fetcher = async ([url, pageIndex]: [string, number]) => {
    // Use real API for logged-in users
    if (isLoggedIn) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = await response.json();

        if (
          !data.posts ||
          !Array.isArray(data.posts) ||
          data.posts.length === 0
        ) {
          return [];
        }

        // Extract all unique user IDs (post authors and comment authors)
        const postAuthorIds = data.posts.map((post: any) => post.userId);
        const commentAuthorIds = data.posts
          .flatMap((post: any) =>
            Array.isArray(post.comments)
              ? post.comments.map((c: any) => c.userId)
              : []
          )
          .filter(Boolean);

        // Combine all user IDs and remove duplicates
        const allUserIds = [
          ...new Set([...postAuthorIds, ...commentAuthorIds]),
        ];

        // Fetch all users in one batch request
        const usersMap = await fetchMultipleUsers(allUserIds);

        // Process posts with the user data we fetched
        const processedPosts = data.posts.map((post: any) => {
          const author = usersMap.get(post.userId) || {};
          const authorEmail =
            author.email || `user_${post.userId.slice(-4)}@example.com`;
          const userImageUrl = getUserImage(author.image, post.userId);

          // Process comments
          const processedComments = Array.isArray(post.comments)
            ? post.comments.map((comment: any) => {
                const commentAuthor = usersMap.get(comment.userId) || {};
                return {
                  username:
                    commentAuthor.email ||
                    `user_${comment.userId.slice(-4)}@example.com`,
                  comment: comment.comment || "No comment text",
                  timeAgo: comment.createdAt
                    ? formatTimeAgo(new Date(comment.createdAt))
                    : formatTimeAgo(new Date()),
                  userImage: getUserImage(commentAuthor.image, comment.userId),
                };
              })
            : [];

          // Check if the current user has liked this post
          const isLiked =
            Array.isArray(post.likes) && session?.user?.id
              ? post.likes.includes(session.user.id)
              : false;

          return {
            id: post.id || "unknown",
            userId: post.userId || "unknown",
            username: authorEmail,
            userImage: userImageUrl,
            timeAgo: post.createdAt
              ? formatTimeAgo(new Date(post.createdAt))
              : post.timeAgo || "recently",
            image: post.image || "/placeholder.svg",
            likes: post.likes?.length || 0,
            caption: post.caption || "",
            comments: processedComments,
            liked: isLiked,
          };
        });

        return processedPosts;
      } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
      }
    } else {
      // For non-logged-in users, use dummy data
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateDummyPosts(PAGE_SIZE, pageIndex * PAGE_SIZE);
    }
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, fetcher, {
      revalidateFirstPage: false,
      persistSize: true,
      revalidateOnFocus: isLoggedIn, // Only revalidate on focus for logged-in users
    });

  const posts = data ? data.flat() : [];
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (
        target.isIntersecting &&
        !isReachingEnd &&
        !isLoadingMore &&
        !isValidating
      ) {
        setSize(size + 1);
      }
    },
    [isReachingEnd, isLoadingMore, isValidating, setSize, size]
  );

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(onIntersect, {
      rootMargin: "0px 0px 400px 0px",
    });

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [onIntersect]);

  const handlePostCreated = useCallback(() => {
    // Revalidate the first page to show the new post
    console.log("Revalidating SWR data after post creation");
    mutate();
  }, [mutate]);

  const handlePostUpdated = useCallback(
    (postId?: string) => {
      // Handle post deletion
      if (postId) {
        // Track deleted post IDs
        setDeletedPostIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.add(postId);
          return newIds;
        });
      }

      // Revalidate the data
      console.log("Revalidating SWR data after post update");
      mutate();
    },
    [mutate]
  );

  // Filter out deleted posts from the displayed posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => !deletedPostIds.has(post.id));
  }, [posts, deletedPostIds]);

  return (
    <>
      <NextSeo
        title="Picwall - Share your moments, connect with friends, and discover amazing photos from around the world."
        description="Picwall is a social media platform for sharing photos and connecting with friends."
        canonical="https://picwall.com"
        openGraph={{
          url: "https://picwall.com",
          title: "Picwall",
        }}
      />
      <div
        className={`flex min-h-screen bg-black text-white ${geistSans.variable} ${geistMono.variable}`}
      >
        {!isMobile && <Sidebar onPostCreated={handlePostCreated} />}

        <main
          className={`flex-1 mx-auto py-6 px-4 space-y-8 ${
            isMobile ? "w-full pt-16 pb-20 max-w-lg" : "max-w-3xl"
          }`}
          suppressHydrationWarning
        >
          {isLoggedIn && (
            <div className="flex items-center justify-between mb-6">
              <div className="text-lg font-medium">Your Feed</div>
            </div>
          )}

          {isLoading && size === 1 ? (
            // Loading skeleton cards for better UX
            <div className="space-y-8">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-md overflow-hidden">
                  {/* Skeleton header */}
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse"></div>
                    <div className="h-4 w-32 bg-zinc-800 animate-pulse rounded"></div>
                  </div>

                  {/* Skeleton image */}
                  <div className="aspect-square bg-zinc-800 animate-pulse"></div>

                  {/* Skeleton content */}
                  <div className="p-3 space-y-3">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse"></div>
                      <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse"></div>
                    </div>
                    <div className="h-4 w-24 bg-zinc-800 animate-pulse rounded"></div>
                    <div className="h-4 w-full bg-zinc-800 animate-pulse rounded"></div>
                    <div className="h-4 w-3/4 bg-zinc-800 animate-pulse rounded"></div>

                    {/* Skeleton comments */}
                    <div className="mt-2">
                      <div className="h-3 w-48 bg-zinc-800 animate-pulse rounded mb-2"></div>
                      <div className="h-3 w-32 bg-zinc-800 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              Error loading posts. Please try again.
            </div>
          ) : isEmpty ? (
            <div className="text-center py-10">
              {isLoggedIn
                ? "No posts found. Follow some users or create your first post!"
                : "No posts found."}
            </div>
          ) : (
            <>
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  userId={post.userId}
                  username={post.username}
                  userImage={post.userImage}
                  timeAgo={post.timeAgo}
                  image={post.image}
                  likes={post.likes}
                  caption={post.caption}
                  comments={post.comments}
                  isLoggedIn={isLoggedIn}
                  liked={post.liked}
                  onPostUpdate={() => handlePostUpdated(post.id)}
                />
              ))}

              <div ref={loadMoreRef} className="py-4 text-center">
                {isLoadingMore ? (
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin"></div>
                    <span className="text-zinc-400">Loading more posts...</span>
                  </div>
                ) : isReachingEnd ? (
                  <div className="text-zinc-500">No more posts to load</div>
                ) : (
                  <button
                    onClick={() => setSize(size + 1)}
                    className="px-4 py-2 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors"
                  >
                    Load more
                  </button>
                )}
              </div>
            </>
          )}
        </main>

        {isMobile && <Sidebar onPostCreated={handlePostCreated} />}
      </div>

      {/* Create Post Modal */}
      {isLoggedIn && (
        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          onPostCreated={handlePostCreated}
          username={session?.user?.email || "user@example.com"}
          userImage={session?.user?.image || "/placeholder-user.jpg"}
        />
      )}
    </>
  );
}
