import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "@/lib/auth-client";
import { NextPage } from "next";

const ProfileRedirect: NextPage = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    console.log("session", session);
    // Wait until authentication is determined
    if (isPending) return;

    if (session && session.user) {
      // Redirect to the user's profile page using email as username
      router.replace(`/profile/${session.user.email}`);
    } else {
      // User is not authenticated, show 404
      router.replace("/404");
    }
  }, [session, isPending, router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
};

export default ProfileRedirect;
