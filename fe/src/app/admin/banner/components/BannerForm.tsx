"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Banner, BannerSubmitData } from "../types";

interface BannerFormProps {
  banner?: Banner;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BannerSubmitData) => Promise<void>;
}

type FormErrors = {
  title?: string;
  description?: string;
  image?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  link?: string;
  buttonText?: string;
  form?: string;
};

export default function BannerForm({
  banner,
  isOpen,
  onClose,
  onSubmit,
}: BannerFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "active" as "active" | "inactive",
    startDate: "",
    endDate: "",
    link: "",
    buttonText: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || "",
        description: banner.description || "",
        status: banner.status || "active",
        startDate: banner.startDate
          ? new Date(banner.startDate).toISOString().split("T")[0]
          : "",
        endDate: banner.endDate
          ? new Date(banner.endDate).toISOString().split("T")[0]
          : "",
        link: banner.link || "",
        buttonText: banner.buttonText || "Xem ngay",
      });

      setImagePreview(banner.imageUrl || null);
      setSelectedFile(null);
      setErrors({});
    } else {
      setFormData({
        title: "",
        description: "",
        status: "active",
        startDate: "",
        endDate: "",
        link: "",
        buttonText: "Xem ngay",
      });
      setSelectedFile(null);
      setImagePreview(null);
      setErrors({});
    }
  }, [banner, isOpen]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề không được để trống";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả không được để trống";
    }

    if (!formData.status) {
      newErrors.status = "Trạng thái không được để trống";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Ngày bắt đầu không được để trống";
    }

    if (!formData.endDate) {
      newErrors.endDate = "Ngày kết thúc không được để trống";
    }

    if (!formData.link.trim()) {
      newErrors.link = "Link không được để trống";
    }

    if (!formData.buttonText.trim()) {
      newErrors.buttonText = "Text nút không được để trống";
    } else if (formData.buttonText.trim().length < 2) {
      newErrors.buttonText = "Text nút phải từ 2 ký tự trở lên";
    } else if (formData.buttonText.trim().length > 30) {
      newErrors.buttonText = "Text nút tối đa 30 ký tự";
    }

    if (!selectedFile && !banner?.imageUrl) {
      newErrors.image = "Ảnh không được để trống";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate).getTime();
      const end = new Date(formData.endDate).getTime();

      if (end <= start) {
        newErrors.endDate = "Ngày kết thúc phải lớn hơn ngày bắt đầu";
      }
    }

    if (formData.link.trim()) {
      try {
        new URL(formData.link.trim());
      } catch {
        newErrors.link = "Link không hợp lệ";
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: undefined, form: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setSubmitting(false);
      return;
    }

    try {
      const payload: BannerSubmitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        link: formData.link.trim(),
        buttonText: formData.buttonText.trim(),
        image: selectedFile || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (error: any) {
      const msg = error.message || "Có lỗi xảy ra";

      if (msg.toLowerCase().includes("tiêu đề")) {
        setErrors((prev) => ({ ...prev, title: msg }));
      } else if (msg.toLowerCase().includes("mô tả")) {
        setErrors((prev) => ({ ...prev, description: msg }));
      } else if (msg.toLowerCase().includes("ngày bắt đầu")) {
        setErrors((prev) => ({ ...prev, startDate: msg }));
      } else if (msg.toLowerCase().includes("ngày kết thúc")) {
        setErrors((prev) => ({ ...prev, endDate: msg }));
      } else if (msg.toLowerCase().includes("link")) {
        setErrors((prev) => ({ ...prev, link: msg }));
      } else if (msg.toLowerCase().includes("text nút")) {
        setErrors((prev) => ({ ...prev, buttonText: msg }));
      } else if (msg.toLowerCase().includes("ảnh")) {
        setErrors((prev) => ({ ...prev, image: msg }));
      } else {
        setErrors((prev) => ({ ...prev, form: msg }));
      }

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {banner ? "Chỉnh sửa quảng cáo" : "Thêm quảng cáo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
                setErrors((prev) => ({
                  ...prev,
                  title: undefined,
                  form: undefined,
                }));
              }}
              placeholder="Nhập tiêu đề banner"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Mô tả <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
                setErrors((prev) => ({
                  ...prev,
                  description: undefined,
                  form: undefined,
                }));
              }}
              placeholder="Nhập mô tả"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">
              Ảnh banner <span className="text-red-500">*</span>
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImageChange}
              disabled={submitting}
            />
            <p className="text-sm text-muted-foreground">
              Chỉ được chọn 1 ảnh (jpg, jpeg, png, webp)
            </p>
            {errors.image && (
              <p className="text-sm text-red-600">{errors.image}</p>
            )}

            {imagePreview && (
              <div className="relative mt-2 h-56 w-full overflow-hidden rounded-md border">
                <NextImage
                  src={imagePreview}
                  alt="Banner preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Trạng thái <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") => {
                setFormData((prev) => ({ ...prev, status: value }));
                setErrors((prev) => ({
                  ...prev,
                  status: undefined,
                  form: undefined,
                }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Kích hoạt</SelectItem>
                <SelectItem value="inactive">Tắt</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    startDate: undefined,
                    endDate: undefined,
                    form: undefined,
                  }));
                }}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Ngày kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }));
                  setErrors((prev) => ({
                    ...prev,
                    endDate: undefined,
                    form: undefined,
                  }));
                }}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">
              Link điều hướng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="link"
              type="url"
              placeholder="https://example.com"
              value={formData.link}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, link: e.target.value }));
                setErrors((prev) => ({
                  ...prev,
                  link: undefined,
                  form: undefined,
                }));
              }}
            />
            {errors.link && (
              <p className="text-sm text-red-600">{errors.link}</p>
            )}
          </div>

          {errors.form && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errors.form}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="buttonText">
              Text nút <span className="text-red-500">*</span>
            </Label>
            <Input
              id="buttonText"
              value={formData.buttonText}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  buttonText: e.target.value,
                }));
                setErrors((prev) => ({
                  ...prev,
                  buttonText: undefined,
                  form: undefined,
                }));
              }}
              placeholder="Ví dụ: Xem ngay"
            />
            {errors.buttonText && (
              <p className="text-sm text-red-600">{errors.buttonText}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Đang lưu..."
                : banner
                ? "Lưu thay đổi"
                : "Thêm quảng cáo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
