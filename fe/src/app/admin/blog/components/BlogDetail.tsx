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

interface Props {
  blog: Blog;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogDetail({ blog, isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết bài viết</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p>
            <strong>Tiêu đề:</strong> {blog.title}
          </p>

          <p>
            <strong>Slug:</strong> {blog.slug}
          </p>

          <div>
            <strong>Mô tả:</strong>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.description }}
            />
          </div>

          <Badge>{blog.tag}</Badge>

          {/* 1 ảnh */}
          {blog.image?.url ? (
            <div className="relative h-48 w-full">
              <NextImage
                src={blog.image.url}
                alt=""
                fill
                className="object-cover rounded"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có ảnh</p>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
