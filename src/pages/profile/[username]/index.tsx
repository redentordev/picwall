import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useCallback, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileGallery } from "@/components/profile/profile-gallery";
import { Sidebar } from "@/components/picwall/sidebar";
import { User, Post } from "@/types";
import EditProfileModal from "@/components/profile/edit-profile-modal";

// SWR fetcher function
const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error("An error occurred while fetching the data.");
    return res.json();
  });

interface ProfilePageProps {
  fallbackUser: User | null;
  errorMessage?: string;
}

const ProfilePage: NextPage<ProfilePageProps> = ({
  fallbackUser,
  errorMessage,
}) => {
  const router = useRouter();
  const { username } = router.query;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletedPostIds, setDeletedPostIds] = useState<Set<string>>(new Set());
  const [editedPosts, setEditedPosts] = useState<Record<string, Post>>({});

  // Use SWR for user data with the fallback from SSR
  const {
    data: userData,
    error: userError,
    mutate: mutateUser,
  } = useSWR(
    fallbackUser
      ? `/api/user?email=${encodeURIComponent(String(username))}`
      : null,
    fetcher,
    {
      fallbackData: fallbackUser ? { user: fallbackUser } : undefined,
      revalidateOnFocus: false,
    }
  );

  // Use SWR for posts data
  const {
    data: postsData,
    error: postsError,
    mutate: mutatePosts,
  } = useSWR(
    userData?.user?.id ? `/api/post?userId=${userData.user.id}` : null,
    fetcher
  );

  const user = userData?.user;
  const posts = postsData?.posts || [];
  const isLoadingPosts = !postsData && !postsError && !!user;
  const isError = userError || postsError || !!errorMessage;
  const errorMsg = userError?.message || postsError?.message || errorMessage;

  // Create processed posts with reactive UI updates
  const processedPosts = useMemo(() => {
    if (!posts) return [];

    // Filter out deleted posts
    let result = posts.filter((post: Post) => !deletedPostIds.has(post.id));

    // Apply any edits
    result = result.map((post: Post) =>
      editedPosts[post.id] ? { ...post, ...editedPosts[post.id] } : post
    );

    return result;
  }, [posts, deletedPostIds, editedPosts]);

  // Handle post updates with optimistic UI
  const handlePostUpdate = useCallback(
    (action: string, postId?: string, updatedPost?: Post) => {
      if (action === "delete" && postId) {
        setDeletedPostIds(prev => {
          const newIds = new Set(prev);
          newIds.add(postId);
          return newIds;
        });
      } else if (action === "edit" && postId && updatedPost) {
        setEditedPosts(prev => ({
          ...prev,
          [postId]: updatedPost,
        }));
      }

      // Revalidate data after any change
      mutateUser();
      mutatePosts();
    },
    [mutateUser, mutatePosts]
  );

  if (isError || !user) {
    return (
      <>
        <Head>
          <title>User Not Found | Picwall</title>
          <meta
            name="description"
            content="The user you're looking for doesn't exist or is not available."
          />
        </Head>
        <div className="flex min-h-screen bg-black text-white">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto p-8 text-center">
            <div className="h-16 w-16 text-zinc-500 mb-6">
              {/* User not found icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21l-6-6m0 0l-6-6m6 6L4 15m6-6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
            <p className="text-zinc-400 mb-8">
              {errorMsg ||
                "The user you're looking for doesn't exist or may have been removed."}
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const handleEditProfile = () => {
    setIsModalOpen(true);
  };

  const handleProfileUpdated = (updatedUser: User) => {
    // Use SWR's mutate to update the cache
    mutateUser({ user: updatedUser }, false);
    setIsModalOpen(false);
  };

  return (
    <>
      <Head>
        <title>{`${user?.name} (${user?.email}) | Picwall`}</title>
        <meta
          name="description"
          content={user?.bio || `Check out ${user?.name}'s photos on Picwall`}
        />
      </Head>
      <div className="flex min-h-screen bg-black text-white">
        {/* Sidebar */}
        <Sidebar onPostCreated={() => mutatePosts()} />

        {/* Main content */}
        <main className="flex-1 max-w-6xl mx-auto pb-24 md:pb-0">
          <ProfileHeader
            user={user}
            postsCount={processedPosts.length}
            onEditProfile={handleEditProfile}
          />
          <div className="border-t border-zinc-800 mb-4"></div>
          <ProfileGallery
            posts={processedPosts}
            isLoading={isLoadingPosts}
            onPostUpdate={handlePostUpdate}
          />

          {isModalOpen && (
            <EditProfileModal
              user={user}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleProfileUpdated}
            />
          )}
        </main>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  params,
  res,
}) => {
  const email = params?.username as string;

  if (!email || !email.includes("@")) {
    return {
      props: {
        fallbackUser: null,
        errorMessage:
          "Invalid user identifier. Please use a valid email address.",
      },
    };
  }

  try {
    // Fetch user data from the API for initial SSR
    const apiUrl = `${
      process.env.NEXT_PUBLIC_API_URL || ""
    }/api/user?email=${encodeURIComponent(email)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      // Set status code for better SEO handling of not found pages
      if (response.status === 404) {
        res.statusCode = 404;
      }

      return {
        props: {
          fallbackUser: null,
          errorMessage: "User not found",
        },
      };
    }

    const data = await response.json();

    return {
      props: {
        fallbackUser: data.user,
      },
    };
  } catch (error) {
    console.error("Error fetching user:", error);

    return {
      props: {
        fallbackUser: null,
        errorMessage: "Failed to load user profile",
      },
    };
  }
};

export default ProfilePage;
