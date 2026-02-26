"use client";

import { useEffect, useState } from "react";
import { Blog } from "../types";
import NextImage from "next/image";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BlogFormProps {
  blog?: Blog;
  onSubmit: (data: FormData) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
}

export default function BlogForm({
  blog,
  onSubmit,
  isOpen,
  onClose,
  uploadProgress,
  setUploadProgress,
}: BlogFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tag: "",
  });

  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (blog) {
        setFormData({
          title: blog.title,
          description: blog.description,
          tag: blog.tag,
        });
        setExistingImages(blog.images);
        setImagePreview(blog.images.map((img) => img.url));
      } else {
        setFormData({ title: "", description: "", tag: "" });
        setImagePreview([]);
        setSelectedFiles([]);
        setExistingImages([]);
      }
    }
  }, [isOpen, blog]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    setImagePreview((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleRemoveImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingImages.length;
      setSelectedFiles((prev) => prev.filter((_, i) => i !== newIndex));
    }
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("tag", formData.tag);

    existingImages.forEach((img) => form.append("existingImages", img.url));
    selectedFiles.forEach((file) => form.append("images", file));

    await onSubmit(form);

    setIsUploading(false);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {blog ? "Chỉnh sửa bài viết" : "Thêm bài viết"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tiêu đề</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Tag</Label>
            <Input
              value={formData.tag}
              onChange={(e) =>
                setFormData({ ...formData, tag: e.target.value })
              }
              required
            />
          </div>

          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />

          {imagePreview.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {imagePreview.map((url, i) => (
                <div key={i} className="relative h-32">
                  <NextImage
                    src={url}
                    alt=""
                    fill
                    className="object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveImage(i, i < existingImages.length)
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isUploading}>
              {blog ? "Lưu" : "Thêm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
