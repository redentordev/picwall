import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/router";

export default function Protected() {
  const router = useRouter();

  return (
    <div>
      <Button
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
      >
        Logout
      </Button>
    </div>
  );
}
