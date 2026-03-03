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
import TinyEditor from "@/components/editor/TinyEditor";

interface BlogFormProps {
  blog?: Blog;
  onSubmit: (data: FormData) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogForm({
  blog,
  onSubmit,
  isOpen,
  onClose,
}: BlogFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tag: "",
  });

  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    {
      url: string;
      public_id: string;
    }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (blog) {
      // EDIT MODE
      setFormData({
        title: blog.title,
        description: blog.description,
        tag: blog.tag,
      });

      setExistingImages(blog.images || []);
      setSelectedFiles([]);
      setImagePreview([]);
    } else {
      // ADD MODE
      setFormData({
        title: "",
        description: "",
        tag: "",
      });

      setExistingImages([]);
      setSelectedFiles([]);
      setImagePreview([]);
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

  const removeExistingImage = (public_id: string) => {
    setExistingImages((prev) =>
      prev.filter((img) => img.public_id !== public_id)
    );
  };

  const removeNewImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("tag", formData.tag);

    existingImages.forEach((img) => form.append("keepImages", img.public_id));
    selectedFiles.forEach((file) => form.append("images", file));

    await onSubmit(form);

    setIsUploading(false);
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

          <TinyEditor
            value={formData.description}
            onChange={(content) =>
              setFormData({ ...formData, description: content })
            }
          />

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

          {/* ẢNH CŨ */}
          {existingImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {existingImages.map((img) => (
                <div key={img.public_id} className="relative h-32">
                  <NextImage
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.public_id)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ẢNH MỚI */}
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
                    onClick={() => removeNewImage(i)}
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
