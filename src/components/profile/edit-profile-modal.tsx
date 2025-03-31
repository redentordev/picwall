import { useState, useRef } from "react";
import Image from "next/image";
import { User } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Camera } from "lucide-react";
import imageCompression from "browser-image-compression";

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

export default function EditProfileModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [formState, setFormState] = useState({
    name: user.name,
    bio: user.bio || "",
    image: user.image || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(
    user.image || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      setIsUploading(true);
      setUploadFeedback("Uploading your image...");
      setError("");

      try {
        // Read the file as data URL
        const reader = new FileReader();
        reader.onload = async event => {
          const imageDataUrl = event.target?.result as string;
          setImagePreview(imageDataUrl);

          // Upload to server
          await uploadImage(imageDataUrl);
        };
        reader.readAsDataURL(file);
      } catch (_) {
        setError("Failed to read the image file");
        setIsUploading(false);
      }
    }
  };

  const uploadImage = async (imageDataUrl: string) => {
    try {
      setUploadFeedback("Compressing your image...");

      // Convert base64 to file object for compression
      const fetchRes = await fetch(imageDataUrl);
      const blob = await fetchRes.blob();
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      // Compress the image
      const options = {
        maxSizeMB: 0.5, // Smaller size for profile pictures
        maxWidthOrHeight: 800, // Reasonable size for profile pictures
        useWebWorker: true, // Use web worker for better performance
      };

      const compressedFile = await imageCompression(file, options);
      console.log(`Original size: ${file.size / 1024 / 1024} MB`);
      console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);

      // Convert compressed file to base64
      const reader = new FileReader();
      const compressedImageDataUrl = await new Promise<string>(resolve => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });

      setUploadFeedback("Uploading your image...");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: compressedImageDataUrl }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const uploadData = await uploadResponse.json();

      // Update form state with the new image URL
      setFormState(prev => ({
        ...prev,
        image: uploadData.imageUrl,
      }));

      setUploadFeedback("Image uploaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsUploading(true);
      setUploadFeedback("Uploading your image...");
      setError("");

      try {
        const reader = new FileReader();
        reader.onload = async event => {
          const imageDataUrl = event.target?.result as string;
          setImagePreview(imageDataUrl);
          await uploadImage(imageDataUrl);
        };
        reader.readAsDataURL(file);
      } catch (_) {
        setError("Failed to read the image file");
        setIsUploading(false);
      }
    } else {
      setError("Please drop an image file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          ...formState,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const data = await response.json();
      onSave(data.user);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update your profile information.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-900/20 border border-red-900 text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formState.name}
              onChange={handleChange}
              className="bg-zinc-800 border-zinc-700"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formState.bio}
              onChange={handleChange}
              className="bg-zinc-800 border-zinc-700 resize-none"
              placeholder="Tell others about yourself..."
              maxLength={150}
              rows={3}
            />
            <p className="text-xs text-zinc-500 text-right">
              {formState.bio.length}/150
            </p>
          </div>

          <div className="space-y-2">
            <Label>Profile Image</Label>
            <div
              className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-700 rounded-lg"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500">
                  {imagePreview ? (
                    <>
                      <Image
                        src={imagePreview}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                </div>
              </div>

              {uploadFeedback && (
                <p
                  className={`text-sm mb-3 ${
                    isUploading ? "text-blue-400" : "text-green-400"
                  }`}
                >
                  {uploadFeedback}
                </p>
              )}

              <div className="w-full max-w-xs">
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {/* Hidden input to store the image URL */}
                <input
                  id="image"
                  name="image"
                  type="hidden"
                  value={formState.image}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Drag & drop an image or use the upload button
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
