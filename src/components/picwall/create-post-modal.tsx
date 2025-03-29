"use client";

import type React from "react";

import { useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";
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
import {
  ImageIcon,
  X,
  Smile,
  MapPin,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  userImage: string;
}

export function CreatePostModal({
  isOpen,
  onClose,
  username,
  userImage,
}: CreatePostModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CAPTION_LENGTH = 2200;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setSelectedImage(event.target?.result as string);
        setActiveTab("caption");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = event => {
        setSelectedImage(event.target?.result as string);
        setActiveTab("caption");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetForm = () => {
    setSelectedImage(null);
    setCaption("");
    setActiveTab("upload");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      handleClose();
      // Here you would typically show a success notification
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-zinc-900 border-zinc-800 text-white overflow-hidden">
        <DialogHeader className="border-b border-zinc-800 p-4">
          <DialogTitle className="text-center text-white">
            Create new post
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Upload Tab */}
          <TabsContent value="upload" className="m-0">
            <div
              className="flex flex-col items-center justify-center p-10 h-[400px]"
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
            <div className="flex flex-col md:flex-row h-[400px]">
              {/* Image Preview */}
              <div className="relative w-full md:w-1/2 h-full bg-black flex items-center justify-center">
                {selectedImage && (
                  <Image
                    src={selectedImage || "/placeholder.svg"}
                    alt="Post preview"
                    fill
                    className="object-contain"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={() => {
                    setSelectedImage(null);
                    setActiveTab("upload");
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
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
                  className="flex-1 resize-none bg-transparent border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  maxLength={MAX_CAPTION_LENGTH}
                />

                <div className="flex justify-between items-center mt-2 text-zinc-400 text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                    >
                      <Smile className="h-5 w-5" />
                      <span className="sr-only">Add emoji</span>
                    </Button>
                    <span>
                      {caption.length}/{MAX_CAPTION_LENGTH}
                    </span>
                  </div>

                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    <MapPin className="h-4 w-4 mr-1" />
                    Add location
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-zinc-800 p-4">
          {activeTab === "upload" ? (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <div className="flex justify-between w-full">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("upload")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:from-purple-700 active:to-pink-700"
                disabled={isSubmitting || !selectedImage || !caption.trim()}
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
