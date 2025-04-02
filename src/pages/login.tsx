import LoginPage from "@/components/picwall/login-page";
import { NextSeo } from "next-seo";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "@/lib/auth-client";

export default function Login() {
  const router = useRouter();
  const { data, isPending } = useSession();
  const session = data?.session;

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (session && !isPending) {
      router.replace("/");

      // Replace the current history entry with the destination page
      // This prevents users from navigating back to login after authentication
      window.history.replaceState(null, "", "/");
    }
  }, [session, isPending, router]);

  return (
    <>
      <NextSeo
        title="Picwall - Login"
        description="Login to your Picwall account"
        openGraph={{
          type: "website",
          url: "https://picwall.redentor.dev/login",
          title: "Picwall - Login",
          description: "Login to your Picwall account",
        }}
      />
      {/* Only show the login page if user is not authenticated */}
      {!session && <LoginPage />}
    </>
  );
}
