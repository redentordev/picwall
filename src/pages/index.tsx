import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/picwall/sidebar";
import { PostCard } from "@/components/picwall/post-card";
import { useSession } from "@/lib/auth-client";
import { faker } from "@faker-js/faker";
import { useEffect, useRef, useCallback, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { NextSeo } from "next-seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate dummy posts data
const generateDummyPosts = (count: number, startIndex: number = 0) => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const id = (index + 1).toString();
    const seed = index + new Date().getTime();
    const username = faker.internet.userName().toLowerCase();
    const timeAgo = `${faker.number.int({ min: 1, max: 23 })}h`;
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
    const comments = Array.from({ length: commentCount }, () => ({
      username: faker.internet.userName().toLowerCase(),
      comment: faker.lorem.sentence(),
    }));

    return {
      id,
      username,
      userImage: `https://picsum.photos/seed/${seed}/800/800`,
      timeAgo,
      image: `https://picsum.photos/seed/${seed}/800/800`,
      likes,
      caption,
      comments,
    };
  });
};

const PAGE_SIZE = 3;

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

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

    return [`/api/posts`, pageIndex];
  };

  const fetcher = async ([_, pageIndex]: [string, number]) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateDummyPosts(PAGE_SIZE, pageIndex * PAGE_SIZE);
  };

  const { data, error, isLoading, isValidating, size, setSize } =
    useSWRInfinite(getKey, fetcher, {
      revalidateFirstPage: false,
      persistSize: true,
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
        {!isMobile && <Sidebar />}

        <main
          className={`flex-1 mx-auto py-6 px-4 space-y-8 ${
            isMobile ? "w-full pt-16 pb-20 max-w-lg" : "max-w-3xl"
          }`}
          suppressHydrationWarning
        >
          {isLoading && size === 1 ? (
            <div className="text-center py-10">Loading posts...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              Error loading posts. Please try again.
            </div>
          ) : isEmpty ? (
            <div className="text-center py-10">No posts found.</div>
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

        {isMobile && <Sidebar />}
      </div>
    </>
  );
}
