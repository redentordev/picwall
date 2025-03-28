import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/router";

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const SignupForm = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    const result = await signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (result.error) {
      toast.error(`${result.error.statusText}: ${result.error.message}`);
    }

    if (result.data) {
      toast.success("Signed up successfully, redirecting...");
      router.push("/protected");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name" className="text-white">
            Name
          </Label>
          <Input
            id="signup-email"
            type="text"
            placeholder="John Doe"
            required
            className="bg-zinc-800 border-zinc-700 text-white"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-white">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            required
            className="bg-zinc-800 border-zinc-700 text-white"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-white">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            required
            className="bg-zinc-800 border-zinc-700 text-white"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:from-purple-700 active:to-pink-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-700"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-2 text-zinc-400">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 cursor-pointer"
          onClick={async () => await signIn.social({ provider: "github" })}
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button
          variant="outline"
          className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 cursor-pointer"
          onClick={async () => await signIn.social({ provider: "google" })}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Google
        </Button>
      </div>

      <p className="text-center text-sm text-zinc-400">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="text-blue-400 hover:text-blue-300">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
};

export default SignupForm;
