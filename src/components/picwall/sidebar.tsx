import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  Compass,
  Heart,
  PlusSquare,
  User,
  LogOut,
  MessageCircle,
  Bookmark,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isLoggedIn = !!session;
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Desktop sidebar
  if (!isMobile) {
    return (
      <div className="w-64 border-r border-zinc-800 h-screen sticky top-0 flex flex-col">
        <div className="p-6">
          <Link href="/home" className="text-2xl font-bold">
            Picwall
          </Link>
        </div>

        <nav className="flex-1 px-3">
          <div className="space-y-1">
            <NavItem
              href="/home"
              icon={<Home className="w-5 h-5 mr-3" />}
              isActive={pathname === "/home"}
            >
              Home
            </NavItem>
            <NavItem
              href="/search"
              icon={<Search className="w-5 h-5 mr-3" />}
              isActive={pathname === "/search"}
            >
              Search
            </NavItem>
            <NavItem
              href="/explore"
              icon={<Compass className="w-5 h-5 mr-3" />}
              isActive={pathname === "/explore"}
            >
              Explore
            </NavItem>
            {isLoggedIn && (
              <>
                <NavItem
                  href="/messages"
                  icon={<MessageCircle className="w-5 h-5 mr-3" />}
                  isActive={pathname === "/messages"}
                >
                  Messages
                </NavItem>
                <NavItem
                  href="/notifications"
                  icon={<Heart className="w-5 h-5 mr-3" />}
                  isActive={pathname === "/notifications"}
                >
                  Notifications
                </NavItem>
                <NavItem
                  href="/create"
                  icon={<PlusSquare className="w-5 h-5 mr-3" />}
                  isActive={pathname === "/create"}
                >
                  Create
                </NavItem>
                <NavItem
                  href="/saved"
                  icon={<Bookmark className="w-5 h-5 mr-3" />}
                  isActive={pathname === "/saved"}
                >
                  Saved
                </NavItem>
                <NavItem
                  href="/profile"
                  icon={<User className="w-5 h-5 mr-3" />}
                  isActive={pathname === "/profile"}
                >
                  Profile
                </NavItem>
              </>
            )}
          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-zinc-800">
          {isLoggedIn ? (
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-zinc-800"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Log out
            </Button>
          ) : (
            <div className="space-y-2">
              <Link href="/" className="block">
                <Button variant="ghost" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-white">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile bottom navigation
  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex justify-between items-center">
        <Link href="/home" className="text-xl font-bold">
          Picwall
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-90 flex flex-col pt-16 pb-20 px-4">
          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            <MobileNavItem
              href="/home"
              icon={<Home className="w-5 h-5" />}
              isActive={pathname === "/home"}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </MobileNavItem>
            <MobileNavItem
              href="/search"
              icon={<Search className="w-5 h-5" />}
              isActive={pathname === "/search"}
              onClick={() => setIsMenuOpen(false)}
            >
              Search
            </MobileNavItem>
            <MobileNavItem
              href="/explore"
              icon={<Compass className="w-5 h-5" />}
              isActive={pathname === "/explore"}
              onClick={() => setIsMenuOpen(false)}
            >
              Explore
            </MobileNavItem>
            {isLoggedIn && (
              <>
                <MobileNavItem
                  href="/messages"
                  icon={<MessageCircle className="w-5 h-5" />}
                  isActive={pathname === "/messages"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Messages
                </MobileNavItem>
                <MobileNavItem
                  href="/notifications"
                  icon={<Heart className="w-5 h-5" />}
                  isActive={pathname === "/notifications"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Notifications
                </MobileNavItem>
                <MobileNavItem
                  href="/create"
                  icon={<PlusSquare className="w-5 h-5" />}
                  isActive={pathname === "/create"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create
                </MobileNavItem>
                <MobileNavItem
                  href="/saved"
                  icon={<Bookmark className="w-5 h-5" />}
                  isActive={pathname === "/saved"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Saved
                </MobileNavItem>
                <MobileNavItem
                  href="/profile"
                  icon={<User className="w-5 h-5" />}
                  isActive={pathname === "/profile"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </MobileNavItem>
              </>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800">
            {isLoggedIn ? (
              <Button
                variant="ghost"
                className="w-full justify-center text-red-400 hover:text-red-300 hover:bg-zinc-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Log out
              </Button>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  href="/"
                  className="block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link
                  href="/"
                  className="block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-white">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 py-2 px-2 grid grid-cols-5 items-center">
        <MobileNavIcon
          href="/home"
          icon={
            <Home
              className={cn(
                "w-6 h-6",
                pathname === "/home" ? "text-white" : "text-zinc-500"
              )}
            />
          }
        />
        <MobileNavIcon
          href="/search"
          icon={
            <Search
              className={cn(
                "w-6 h-6",
                pathname === "/search" ? "text-white" : "text-zinc-500"
              )}
            />
          }
        />
        <MobileNavIcon
          href="/explore"
          icon={
            <Compass
              className={cn(
                "w-6 h-6",
                pathname === "/explore" ? "text-white" : "text-zinc-500"
              )}
            />
          }
        />
        {isLoggedIn ? (
          <>
            <MobileNavIcon
              href="/notifications"
              icon={
                <Heart
                  className={cn(
                    "w-6 h-6",
                    pathname === "/notifications"
                      ? "text-white"
                      : "text-zinc-500"
                  )}
                />
              }
            />
            <MobileNavIcon
              href="/profile"
              icon={
                <User
                  className={cn(
                    "w-6 h-6",
                    pathname === "/profile" ? "text-white" : "text-zinc-500"
                  )}
                />
              }
            />
          </>
        ) : (
          <>
            <Link href="/" className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1 text-zinc-500 hover:text-white"
              >
                Login
              </Button>
            </Link>
            <Link href="/" className="flex items-center justify-center">
              <Button
                size="sm"
                className="text-xs h-auto py-1 bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-white"
              >
                Sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-3 text-sm rounded-md transition-colors",
        isActive
          ? "bg-zinc-800 text-white font-medium"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

interface MobileNavItemProps extends NavItemProps {
  onClick?: () => void;
}

function MobileNavItem({
  href,
  icon,
  children,
  isActive,
  onClick,
}: MobileNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-4 py-4 text-base rounded-md transition-colors",
        isActive
          ? "bg-zinc-800 text-white font-medium"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      )}
      onClick={onClick}
    >
      <div className="w-6 h-6 mr-4 flex items-center justify-center">
        {icon}
      </div>
      {children}
    </Link>
  );
}

interface MobileNavIconProps {
  href: string;
  icon: React.ReactNode;
}

function MobileNavIcon({ href, icon }: MobileNavIconProps) {
  return (
    <Link href={href} className="flex items-center justify-center py-1 w-full">
      {icon}
    </Link>
  );
}
