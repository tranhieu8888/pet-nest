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
          <div>
            <strong>Mô tả:</strong>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.description }}
            />
          </div>
          <Badge>{blog.tag}</Badge>

          <div className="grid grid-cols-2 gap-2">
            {blog.images.map((img, i) => (
              <div key={i} className="relative h-32">
                <NextImage
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
