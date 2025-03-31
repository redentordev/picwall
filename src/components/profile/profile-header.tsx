import Image from "next/image";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface ProfileHeaderProps {
  user: User;
  postsCount: number;
  onEditProfile: () => void;
}

export function ProfileHeader({
  user,
  postsCount,
  onEditProfile,
}: ProfileHeaderProps) {
  const { data: session } = useSession();
  const isOwnProfile =
    session?.user?.id === user.id || session?.user?.email === user.email;

  return (
    <div className="px-4 py-6 mt-16 md:mt-0">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Profile image */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-zinc-800 flex-shrink-0">
          <Image
            src={
              user.image || `https://picsum.photos/seed/${user.id}_user/200/200`
            }
            alt={user.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* User info */}
        <div className="flex flex-col items-center sm:items-start flex-grow mt-4 sm:mt-0">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditProfile}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit profile</span>
              </Button>
            )}
          </div>
          <p className="text-zinc-400 mb-2">{user.email}</p>

          {user.bio && (
            <p className="text-sm text-zinc-300 max-w-lg text-center sm:text-left mb-3">
              {user.bio}
            </p>
          )}

          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="font-bold">{postsCount}</span>
              <p className="text-xs text-zinc-400">Posts</p>
            </div>
            {/* You can add followers/following counts here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
