"use client";

import { Blog } from "../types";
import NextImage from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Tag, Link2, Calendar } from "lucide-react";

interface Props {
  blog: Blog;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogDetail({ blog, isOpen, onClose }: Props) {
  const created = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("vi-VN")
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">
            Chi tiết bài viết
          </DialogTitle>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="gap-2">
              <Tag className="h-4 w-4" />
              {blog.tag}
            </Badge>

            <Badge variant="secondary" className="gap-2">
              <Eye className="h-4 w-4" />
              {blog.views ?? 0} lượt xem
            </Badge>

            {created && (
              <Badge variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {created}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold leading-snug">
              {blog.title}
            </h2>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" />
              <span className="font-mono break-all">{blog.slug}</span>
            </div>
          </div>

          {/* Image */}
          {blog.image?.url ? (
            <div className="overflow-hidden rounded-xl border bg-muted">
              <div className="relative w-full aspect-[16/9]">
                <NextImage
                  src={blog.image.url}
                  alt={blog.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              Không có ảnh
            </div>
          )}

          {/* Description */}
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 text-sm font-semibold text-muted-foreground">
              Nội dung
            </div>

            <div
              className="prose max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: blog.description }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
