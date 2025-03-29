"use client";

import type React from "react";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./login-form";
import SignupForm from "./signup-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-black">
      <div className="relative hidden w-full md:flex md:w-1/2 bg-black">
        <Image
          src="https://picsum.photos/seed/1920/1080"
          alt="Picwall background"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 bg-gradient-to-t from-black/60 to-black/30">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold text-white mb-6">
              <Link href="/">Picwall</Link>
            </h1>
            <p className="text-white/90 text-lg">
              Share your moments, connect with friends, and discover amazing
              photos from around the world.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center md:w-1/2 bg-black p-8 my-auto">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-2 text-center">
            <Link href="/">
              <h1 className="text-4xl font-bold text-white md:hidden">
                Picwall
              </h1>
            </Link>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <LoginForm />
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
