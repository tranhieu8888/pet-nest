"use client";

import { useEffect, useRef, useState } from "react";
import { Blog } from "../types";
import NextImage from "next/image";
import { Loader2, Sparkles, Trash2 } from "lucide-react";

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

type Errors = {
  title?: string;
  tag?: string;
  description?: string;
  image?: string;
  form?: string;
};

interface SuggestResponse {
  success?: boolean;
  description?: string;
  tag?: string;
  message?: string;
}

function stripHtml(html: string) {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface BlogFormProps {
  blog?: Blog;
  onSubmit: (data: FormData) => Promise<void>;
  onSuggestTitle: (title: string) => Promise<SuggestResponse>;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogForm({
  blog,
  onSubmit,
  onSuggestTitle,
  isOpen,
  onClose,
}: BlogFormProps) {
  const isEdit = !!blog;

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
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const lastSuggestedTitleRef = useRef("");

  useEffect(() => {
    if (!isOpen) return;

    if (blog) {
      setFormData({
        title: blog.title || "",
        description: blog.description || "",
        tag: blog.tag || "",
      });
      setExistingImage(blog.image?.url ? blog.image : null);
      lastSuggestedTitleRef.current = blog.title || "";
    } else {
      setFormData({ title: "", description: "", tag: "" });
      setExistingImage(null);
      lastSuggestedTitleRef.current = "";
    }

    setSelectedFile(null);
    setImagePreview("");
    setErrors({});
    setIsUploading(false);
    setIsSuggesting(false);
  }, [isOpen, blog]);

  useEffect(() => {
    if (!isOpen || isEdit) return;

    const cleanTitle = formData.title.trim();

    if (cleanTitle.length < 5) return;
    if (cleanTitle === lastSuggestedTitleRef.current) return;

    const timer = setTimeout(() => {
      handleSuggest(cleanTitle, true);
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.title, isOpen, isEdit]);

  const validateAll = (): Errors => {
    const next: Errors = {};

    if (!formData.title.trim()) {
      next.title = "Tiêu đề không được để trống.";
    }

    if (!stripHtml(formData.description)) {
      next.description = "Mô tả không được để trống.";
    }

    if (!formData.tag.trim()) {
      next.tag = "Tag không được để trống.";
    }

    const hasAnyImage = !!selectedFile || !!existingImage?.url;
    if (!hasAnyImage) {
      next.image = isEdit
        ? "Bạn đã xoá ảnh cũ, vui lòng chọn ảnh mới."
        : "Vui lòng chọn 1 ảnh.";
    }

    return next;
  };

  const mapServerErrorToField = (message: string): Errors => {
    const msg = (message || "").toLowerCase();

    if (msg.includes("tiêu đề")) {
      return { title: message };
    }

    if (msg.includes("mô tả")) {
      return { description: message };
    }

    if (msg.includes("tag")) {
      return { tag: message };
    }

    if (msg.includes("ảnh") || msg.includes("upload")) {
      return { image: message };
    }

    return { form: message || "Có lỗi xảy ra, vui lòng thử lại." };
  };

  const handleTitleChange = (v: string) => {
    setFormData((prev) => ({ ...prev, title: v }));
  };

  const handleTagChange = (v: string) => {
    setFormData((prev) => ({ ...prev, tag: v }));
  };

  const handleDescChange = (v: string) => {
    setFormData((prev) => ({ ...prev, description: v }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        image: "File không hợp lệ. Vui lòng chọn ảnh.",
      }));
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({
      ...prev,
      image: undefined,
      form: undefined,
    }));
  };

  const removeExistingImage = () => {
    setExistingImage(null);
    setErrors((prev) => ({
      ...prev,
      image: undefined,
      form: undefined,
    }));
  };

  const removeNewImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setErrors((prev) => ({
      ...prev,
      image: undefined,
      form: undefined,
    }));
  };

  const handleSuggest = async (rawTitle?: string, autoFillOnlyEmpty = true) => {
    const cleanTitle = (rawTitle ?? formData.title).trim();

    if (isEdit) return;
    if (cleanTitle.length < 5) return;

    try {
      setIsSuggesting(true);

      const res = await onSuggestTitle(cleanTitle);

      if (!res?.success) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        description:
          autoFillOnlyEmpty && stripHtml(prev.description)
            ? prev.description
            : res.description || prev.description,
        tag:
          autoFillOnlyEmpty && prev.tag.trim() ? prev.tag : res.tag || prev.tag,
      }));

      lastSuggestedTitleRef.current = cleanTitle;
    } catch {
      // bỏ qua lỗi AI suggest để không ảnh hưởng flow nhập liệu
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateAll();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsUploading(true);
    setErrors({});

    try {
      const form = new FormData();
      form.append("title", formData.title.trim());
      form.append("description", formData.description);
      form.append("tag", formData.tag.trim());

      if (!existingImage && !selectedFile && blog?.image?.url) {
        form.append("removeImage", "true");
      }

      if (selectedFile) {
        form.append("image", selectedFile);
      }

      await onSubmit(form);
      onClose();
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra, vui lòng thử lại.";

      setErrors(mapServerErrorToField(serverMessage));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {blog ? "Chỉnh sửa bài viết" : "Thêm bài viết"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <div className="flex gap-2">
              <Input
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
              />

              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSuggest(formData.title, false)}
                  disabled={isSuggesting || !formData.title.trim()}
                >
                  {isSuggesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}

            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Khi nhập tiêu đề, AI sẽ tự gợi ý mô tả và tag.
              </p>
            )}
          </div>

          <div>
            <Label className="mb-3">Mô tả</Label>
            <TinyEditor
              value={formData.description}
              onChange={handleDescChange}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <Label className="mb-3">Tag</Label>
            <Input
              value={formData.tag}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="#pet"
            />
            {errors.tag && (
              <p className="mt-1 text-sm text-red-600">{errors.tag}</p>
            )}
          </div>

          {blog && (
            <div>
              <Label className="mb-3">Lượt xem</Label>
              <Input value={String(blog.views ?? 0)} readOnly disabled />
            </div>
          )}

          <div>
            <Label className="mb-3">Ảnh</Label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            )}
          </div>

          {existingImage?.url && (
            <div className="relative h-40 w-full">
              <NextImage
                src={existingImage.url}
                alt=""
                fill
                className="rounded object-cover"
              />
              <button
                type="button"
                onClick={removeExistingImage}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <Label className="my-3">Ảnh mới</Label>
          {imagePreview && (
            <div className="relative h-40 w-full">
              <NextImage
                src={imagePreview}
                alt=""
                fill
                className="rounded object-cover"
              />
              <button
                type="button"
                onClick={removeNewImage}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Hủy
            </Button>

            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Đang xử lý..." : blog ? "Lưu" : "Thêm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
