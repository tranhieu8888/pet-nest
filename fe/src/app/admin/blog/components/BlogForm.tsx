"use client";

import { useEffect, useMemo, useState } from "react";
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

type Errors = {
  title?: string;
  tag?: string;
  description?: string;
  image?: string;
  form?: string;
};

function stripHtml(html: string) {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateTag(tag: string) {
  const t = (tag || "").trim();
  // yêu cầu "#xx" (2 ký tự sau # trở lên)
  return /^#[^\s#]{2,}$/.test(t);
}

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
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!isOpen) return;

    if (blog) {
      setFormData({
        title: blog.title || "",
        description: blog.description || "",
        tag: blog.tag || "",
      });
      setExistingImage(blog.image?.url ? blog.image : null);
    } else {
      setFormData({ title: "", description: "", tag: "" });
      setExistingImage(null);
    }

    setSelectedFile(null);
    setImagePreview("");
    setErrors({});
    setIsUploading(false);
  }, [isOpen, blog]);

  // ---------- validate helpers ----------
  const validateAll = (): Errors => {
    const next: Errors = {};
    const title = formData.title.trim();
    const tag = formData.tag.trim();
    const plainDesc = stripHtml(formData.description);

    if (!title) next.title = "Tiêu đề không được để trống.";
    else if (title.length < 10)
      next.title = "Tiêu đề phải từ 10 ký tự trở lên.";

    if (!tag) next.tag = "Tag không được để trống.";
    else if (!validateTag(tag))
      next.tag = "Tag phải đúng định dạng #xx (ít nhất 2 ký tự sau #).";

    if (!plainDesc) next.description = "Mô tả không được để trống.";
    else if (plainDesc.length < 50)
      next.description = "Mô tả phải từ 50 ký tự trở lên (không tính HTML).";

    // ảnh: create bắt buộc có ảnh
    // edit: được giữ ảnh cũ; nếu đã xoá ảnh cũ thì phải chọn ảnh mới
    const hasAnyImage = !!selectedFile || !!existingImage?.url;
    if (!hasAnyImage) {
      next.image = isEdit
        ? "Bạn đã xoá ảnh cũ, vui lòng chọn ảnh mới."
        : "Vui lòng chọn 1 ảnh.";
    }

    return next;
  };

  const isValid = useMemo(() => {
    const e = validateAll();
    return Object.keys(e).length === 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.title,
    formData.tag,
    formData.description,
    selectedFile,
    existingImage?.url,
  ]);

  // ---------- handlers ----------
  const handleTitleChange = (v: string) => {
    setFormData((p) => ({ ...p, title: v }));
    setErrors((p) => ({ ...p, title: undefined, form: undefined }));
  };

  const handleTagChange = (v: string) => {
    setFormData((p) => ({ ...p, tag: v }));
    setErrors((p) => ({ ...p, tag: undefined, form: undefined }));
  };

  const handleDescChange = (v: string) => {
    setFormData((p) => ({ ...p, description: v }));
    setErrors((p) => ({ ...p, description: undefined, form: undefined }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0];
    if (!file) return;

    // chỉ nhận image/*
    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({
        ...p,
        image: "File không hợp lệ. Vui lòng chọn ảnh.",
      }));
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, image: undefined, form: undefined }));
  };

  const removeExistingImage = () => {
    setExistingImage(null);
    setErrors((p) => ({ ...p, image: undefined, form: undefined }));
  };

  const removeNewImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setErrors((p) => ({ ...p, image: undefined, form: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateAll();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsUploading(true);
    setErrors((p) => ({ ...p, form: undefined }));

    try {
      const form = new FormData();
      form.append("title", formData.title.trim());
      form.append("description", formData.description);
      form.append("tag", formData.tag.trim());

      // nếu xoá ảnh cũ và không upload ảnh mới => removeImage=true
      if (!existingImage && !selectedFile && blog?.image?.url) {
        form.append("removeImage", "true");
      }

      if (selectedFile) {
        form.append("image", selectedFile);
      }

      await onSubmit(form);
      onClose();
    } catch (err: any) {
      // quan trọng: không để kẹt nút
      setErrors((p) => ({
        ...p,
        form: err?.message || "Có lỗi xảy ra, vui lòng thử lại.",
      }));
    } finally {
      // quan trọng: luôn reset isUploading
      setIsUploading(false);
    }
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
          {/* FORM ERROR */}
          {errors.form && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <div>
            <Label>Tiêu đề</Label>
            <Input
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <Label>Mô tả</Label>
            <TinyEditor
              value={formData.description}
              onChange={handleDescChange}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Độ dài hiện tại: {stripHtml(formData.description).length} / 50
            </p>
          </div>

          <div>
            <Label>Tag</Label>
            <Input
              value={formData.tag}
              onChange={(e) => handleTagChange(e.target.value)}
            />
            {errors.tag && (
              <p className="mt-1 text-sm text-red-600">{errors.tag}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Ví dụ hợp lệ: #pet, #dog, #cat (ít nhất 2 ký tự sau #)
            </p>
          </div>

          {/* ẢNH */}
          <div>
            <Label>Ảnh</Label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            )}
          </div>

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
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Hủy
            </Button>

            {/* Không bị “ẩn hẳn”, chỉ disable khi đang upload hoặc form invalid */}
            <Button type="submit" disabled={isUploading || !isValid}>
              {isUploading ? "Đang xử lý..." : blog ? "Lưu" : "Thêm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
