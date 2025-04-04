import { useState, useEffect, useCallback, useMemo } from "react";
import { NextSeo } from "next-seo";
import useSWR from "swr";
import { useSession } from "@/lib/auth-client";
import { Sidebar } from "@/components/picwall/sidebar";
import { ExploreGallery } from "@/components/explore/explore-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }
  return res.json();
};

export default function ExplorePage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const [isMobile, setIsMobile] = useState(false);
  const [deletedPostIds, setDeletedPostIds] = useState<Set<string>>(new Set());
  const [editedPosts, setEditedPosts] = useState<Record<string, any>>({});

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Fetch all posts
  const { data, error, isLoading, mutate } = useSWR(
    "/api/posts?sort=latest&limit=50",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  // Reactive approach to update UI instantly
  const handlePostUpdated = useCallback(
    (action: string = "update", postId?: string, updatedPost?: any) => {
      // Handle deletion with optimistic UI update
      if (action === "delete" && postId) {
        setDeletedPostIds(prev => {
          const newIds = new Set(prev);
          newIds.add(postId);
          return newIds;
        });
      }

      // Handle edit with optimistic UI update
      else if (action === "edit" && postId && updatedPost) {
        setEditedPosts(prev => ({
          ...prev,
          [postId]: updatedPost,
        }));
      }

      // Always trigger revalidation for data consistency
      mutate();
    },
    [mutate]
  );

  // Create filtered and updated posts
  const processedPosts = useMemo(() => {
    if (!data?.posts) return [];

    // First filter out deleted posts
    let result = data.posts.filter((post: any) => !deletedPostIds.has(post.id));

    // Then apply any edits
    result = result.map((post: any) =>
      editedPosts[post.id] ? { ...post, ...editedPosts[post.id] } : post
    );

    return result;
  }, [data?.posts, deletedPostIds, editedPosts]);

  return (
    <>
      <NextSeo
        title="Explore - Picwall"
        description="Discover amazing photos from users around the world on Picwall."
        openGraph={{
          url: "https://picwall.com/explore",
          title: "Explore - Picwall",
          description: "Discover amazing photos from users around the world",
        }}
      />
      <div
        className={`flex min-h-screen bg-black text-white ${geistSans.variable} ${geistMono.variable}`}
      >
        {!isMobile && (
          <Sidebar onPostCreated={() => handlePostUpdated("create")} />
        )}

        <main
          className={`flex-1 mx-auto py-6 px-4 ${
            isMobile ? "w-full pt-16 pb-20" : ""
          }`}
          suppressHydrationWarning
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Explore</h1>
              <p className="text-zinc-400">
                Discover amazing photos from users around the world
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-full">
                    <Skeleton
                      className={`w-full ${
                        i % 5 === 0
                          ? "aspect-square"
                          : i % 5 === 1
                          ? "aspect-[4/5]"
                          : i % 5 === 2
                          ? "aspect-[4/3]"
                          : i % 5 === 3
                          ? "aspect-[3/4]"
                          : "aspect-square"
                      }`}
                    />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">
                Error loading posts. Please try again.
              </div>
            ) : !processedPosts || processedPosts.length === 0 ? (
              <div className="text-center py-10">
                No posts found. Be the first to share your moments!
              </div>
            ) : (
              <ExploreGallery
                posts={processedPosts}
                isLoggedIn={isLoggedIn}
                userSession={session}
                onPostUpdate={handlePostUpdated}
              />
            )}
          </div>
        </main>

        {isMobile && (
          <Sidebar onPostCreated={() => handlePostUpdated("create")} />
        )}
      </div>
    </>
  );
}
