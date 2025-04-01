"use client";

import type React from "react";

import { useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreatePostSchema } from "@/lib/schemas/post";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ImageIcon, X, ChevronRight, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import imageCompression from "browser-image-compression";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  username: string;
  userImage: string;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  username,
  userImage,
}: CreatePostModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const MAX_CAPTION_LENGTH = 2200;

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreatePostSchema),
    defaultValues: {
      userId: session?.user?.id || "",
      image: "",
      caption: "",
    },
  });

  const caption = watch("caption");
  const imageUrl = watch("image");

  const uploadImage = async (imageDataUrl: string) => {
    setIsUploading(true);
    setFeedbackMessage({
      type: "info",
      message: "Compressing and uploading your image...",
    });

    try {
      // Convert base64 to file object for compression
      const fetchRes = await fetch(imageDataUrl);
      const blob = await fetchRes.blob();
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });

      // Compress the image
      const options = {
        maxSizeMB: 1, // Maximum size in MB
        maxWidthOrHeight: 1800, // Max width/height
        useWebWorker: true, // Use web worker for better performance
      };

      console.log("Starting image compression...");
      const compressedFile = await imageCompression(file, options);
      console.log(`Original size: ${file.size / 1024 / 1024} MB`);
      console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);

      // Convert compressed file to base64
      const reader = new FileReader();
      const compressedImageDataUrl = await new Promise<string>(resolve => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });

      // Upload the compressed image
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: compressedImageDataUrl }),
      });

      console.log("Upload response status:", uploadResponse.status);

      const uploadData = await uploadResponse.json();
      console.log("Upload response data:", uploadData);

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Failed to upload image");
      }

      // Save the image URL to react-hook-form state
      setValue("image", uploadData.imageUrl, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      console.log("Image uploaded successfully:", uploadData.imageUrl);
      setFeedbackMessage({
        type: "success",
        message:
          "Image uploaded successfully! Add a caption to complete your post.",
      });

      return uploadData.imageUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      setFeedbackMessage({
        type: "error",
        message: error.message || "Failed to upload image. Please try again.",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async event => {
        const imageDataUrl = event.target?.result as string;
        setSelectedImage(imageDataUrl);
        setActiveTab("caption");

        // Immediately upload the image
        await uploadImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async event => {
        const imageDataUrl = event.target?.result as string;
        setSelectedImage(imageDataUrl);
        setActiveTab("caption");

        // Immediately upload the image
        await uploadImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetForm = () => {
    setSelectedImage(null);
    reset({
      userId: session?.user?.id || "",
      image: "",
      caption: "",
    });
    setActiveTab("upload");
    setFeedbackMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onSubmit = async (data: any) => {
    console.log("Form submitted", { data });

    if (!data.image) {
      setFeedbackMessage({
        type: "error",
        message: "Please wait for image upload to complete",
      });
      return;
    }

    if (!session?.user?.id) {
      console.error("No user session found:", session);
      setFeedbackMessage({
        type: "error",
        message: "You must be logged in to create a post",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage({
      type: "info",
      message: "Creating your post...",
    });

    try {
      // Create the post with the already uploaded image URL from form data
      const postResponse = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          image: data.image, // Using the image URL from form data
          caption: data.caption,
        }),
      });

      console.log("Post response status:", postResponse.status);

      // Read the response JSON only once
      const postData = await postResponse.json();
      console.log("Post response data:", postData);

      if (!postResponse.ok) {
        throw new Error(postData.error || "Failed to create post");
      }

      console.log("Post created successfully:", postData);

      // Show success message briefly
      setFeedbackMessage({
        type: "success",
        message: "Post created successfully!",
      });

      // Close the modal immediately
      handleClose();

      // Call the onPostCreated callback if provided to trigger revalidation
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      setFeedbackMessage({
        type: "error",
        message: error.message || "An error occurred while creating your post",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] p-0 bg-zinc-900 border-zinc-800 text-white overflow-hidden w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-zinc-800 p-4 flex-shrink-0">
          <DialogTitle className="text-center text-white">
            Create new post
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Upload Tab */}
            <TabsContent value="upload" className="m-0">
              <div
                className="flex flex-col items-center justify-center p-10 min-h-[300px]"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <ImageIcon className="h-16 w-16 text-zinc-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Drag photos here</h3>
                <p className="text-zinc-400 text-center mb-6">
                  Share your moments with friends and followers
                </p>
                <Button
                  onClick={triggerFileInput}
                  className="w-full max-w-[230px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:from-purple-700 active:to-pink-700"
                >
                  Upload your image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </TabsContent>

            {/* Caption Tab */}
            <TabsContent value="caption" className="m-0">
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  try {
                    const formData = watch();
                    console.log("Form data before submission:", formData);
                    await handleSubmit(onSubmit)();
                  } catch (error) {
                    console.error("Form submission error:", error);
                    setFeedbackMessage({
                      type: "error",
                      message: "An error occurred while submitting the form",
                    });
                  }
                }}
                id="post-form"
                className="flex flex-col"
              >
                <div className="flex flex-col md:flex-row min-h-[300px]">
                  {/* Image Preview */}
                  <div className="relative w-full md:w-1/2 h-[250px] md:h-[350px] bg-black flex items-center justify-center">
                    {selectedImage && (
                      <Image
                        src={selectedImage || "/placeholder.svg"}
                        alt="Post preview"
                        fill
                        className="object-contain"
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                      onClick={() => {
                        setSelectedImage(null);
                        setValue("image", "");
                        setActiveTab("upload");
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove image</span>
                    </Button>

                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  {/* Caption Input */}
                  <div className="w-full md:w-1/2 p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar className="w-8 h-8 border border-zinc-700">
                        <AvatarImage src={userImage} alt={username} />
                        <AvatarFallback>
                          {username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{username}</span>
                    </div>

                    <Textarea
                      placeholder="Write a caption..."
                      className="flex-1 resize-none bg-transparent border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[100px]"
                      maxLength={MAX_CAPTION_LENGTH}
                      {...register("caption")}
                    />
                    {errors.caption && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.caption.message}
                      </p>
                    )}

                    <div className="flex justify-end items-center mt-2 text-zinc-400 text-xs">
                      <span>
                        {caption?.length || 0}/{MAX_CAPTION_LENGTH}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hidden input for image URL */}
                <input type="hidden" {...register("image")} />
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Feedback Messages */}
        {feedbackMessage && (
          <div
            className={`px-4 py-2 text-sm flex-shrink-0 ${
              feedbackMessage.type === "error"
                ? "bg-red-500/20 text-red-200"
                : feedbackMessage.type === "success"
                  ? "bg-green-500/20 text-green-200"
                  : "bg-blue-500/20 text-blue-200"
            }`}
          >
            {feedbackMessage.message}
          </div>
        )}

        <DialogFooter className="border-t border-zinc-800 p-4 flex-shrink-0">
          {activeTab === "upload" ? (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveTab("upload")}
                disabled={isSubmitting || isUploading}
              >
                Back
              </Button>
              <Button
                form="post-form"
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:from-purple-700 active:to-pink-700"
                disabled={
                  isSubmitting || isUploading || !imageUrl || !caption?.trim()
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    Share
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
