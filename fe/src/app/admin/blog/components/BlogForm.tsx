"use client";

import { useEffect, useState } from "react";
import { Blog } from "../types";
import NextImage from "next/image";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TinyEditor from "@/components/editor/TinyEditor";
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

  const [existingImage, setExistingImage] = useState<{
    url: string;
    public_id: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (blog) {
      setFormData({
        title: blog.title,
        description: blog.description,
        tag: blog.tag,
      });

      setExistingImage(blog.image?.url ? blog.image : null);
      setSelectedFile(null);
      setImagePreview("");
    } else {
      setFormData({ title: "", description: "", tag: "" });
      setExistingImage(null);
      setSelectedFile(null);
      setImagePreview("");
    }
  }, [isOpen, blog]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeExistingImage = () => {
    setExistingImage(null);
  };

  const removeNewImage = () => {
    setSelectedFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("tag", formData.tag);

    // nếu đã xoá ảnh cũ và không upload ảnh mới => removeImage=true
    if (!existingImage && !selectedFile && blog?.image?.url) {
      form.append("removeImage", "true");
    }

    // upload ảnh mới (1 file)
    if (selectedFile) {
      form.append("image", selectedFile);
    }

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

          {/* chọn 1 ảnh */}
          <Input type="file" accept="image/*" onChange={handleImageChange} />

          {/* ẢNH CŨ */}
          {existingImage?.url && (
            <div className="relative h-40 w-full">
              <NextImage
                src={existingImage.url}
                alt=""
                fill
                className="object-cover rounded"
              />
              <button
                type="button"
                onClick={removeExistingImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* ẢNH MỚI PREVIEW */}
          {imagePreview && (
            <div className="relative h-40 w-full">
              <NextImage
                src={imagePreview}
                alt=""
                fill
                className="object-cover rounded"
              />
              <button
                type="button"
                onClick={removeNewImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
              >
                <Trash2 size={16} />
              </button>
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
