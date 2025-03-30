import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import Head from "next/head";

export default function NotFound() {
  const router = useRouter();

  // Redirect to home after 5 seconds if the user navigates directly to this page
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <>
      <Head>
        <title>User Not Found | Picwall</title>
        <meta
          name="description"
          content="The user you're looking for doesn't exist or may have been removed."
        />
      </Head>
      <div className="flex min-h-screen bg-black text-white">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto p-8 text-center">
          <UserX className="h-16 w-16 text-zinc-500 mb-6" />
          <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
          <p className="text-zinc-400 mb-6">
            The user you're looking for doesn't exist or may have been removed.
          </p>
          <p className="text-zinc-500 text-sm mb-8">
            Redirecting to home page in 5 seconds...
          </p>
          <Button asChild>
            <Link href="/">Return Home Now</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
