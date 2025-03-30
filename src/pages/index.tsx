import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/picwall/sidebar";
import { PostCard } from "@/components/picwall/post-card";
import { useSession } from "@/lib/auth-client";
import { faker } from "@faker-js/faker";
import { useEffect, useRef, useCallback, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { NextSeo } from "next-seo";
import { CreatePostModal } from "@/components/picwall/create-post-modal";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

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
        console.log("API response:", data); // Debug the API response

        // Process posts in parallel to get user emails
        const processedPosts = await Promise.all(
          (data.posts || []).map(async (post: any) => {
            // Get email for the post author
            const authorEmail = await getUserEmailById(post.userId);

            // Get the user data for profile image
            let userImageUrl;
            try {
              const userResponse = await fetch(`/api/user?id=${post.userId}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                // Use the image from user data or fallback to generated image
                userImageUrl = getUserImage(userData.user.image, post.userId);
              } else {
                // Fallback to generated image
                userImageUrl = getUserImage(null, post.userId);
              }
            } catch (error) {
              console.error("Error fetching user image:", error);
              userImageUrl = getUserImage(null, post.userId);
            }

            // Process comments to get emails for comment authors
            const processedComments = await Promise.all(
              Array.isArray(post.comments)
                ? post.comments.map(async (comment: any) => {
                    const commentAuthorEmail = await getUserEmailById(
                      comment.userId
                    );

                    // Get user image for comment author
                    let commentUserImage;
                    try {
                      const userResponse = await fetch(
                        `/api/user?id=${comment.userId}`
                      );
                      if (userResponse.ok) {
                        const userData = await userResponse.json();
                        commentUserImage = getUserImage(
                          userData.user.image,
                          comment.userId
                        );
                      } else {
                        commentUserImage = getUserImage(null, comment.userId);
                      }
                    } catch (error) {
                      console.error(
                        "Error fetching comment user image:",
                        error
                      );
                      commentUserImage = getUserImage(null, comment.userId);
                    }

                    return {
                      username: commentAuthorEmail,
                      comment: comment.comment || "No comment text",
                      timeAgo: comment.createdAt
                        ? formatTimeAgo(new Date(comment.createdAt))
                        : formatTimeAgo(new Date()),
                      userImage: commentUserImage,
                    };
                  })
                : []
            );

            // Check if the current user has liked this post
            const isLiked =
              Array.isArray(post.likes) && session?.user?.id
                ? post.likes.includes(session.user.id)
                : false;

            return {
              id: post.id || "unknown",
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
          })
        );

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
            <div className="text-center py-10">Loading posts...</div>
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
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  username={post.username}
                  userImage={post.userImage}
                  timeAgo={post.timeAgo}
                  image={post.image}
                  likes={post.likes}
                  caption={post.caption}
                  comments={post.comments}
                  isLoggedIn={isLoggedIn}
                  liked={post.liked}
                />
              ))}

              <div ref={loadMoreRef} className="py-4 text-center">
                {isLoadingMore ? (
                  <div className="text-zinc-400">Loading more posts...</div>
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
