"use client";

import { Subscriber } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Props = {
  subscriber: Subscriber;
  isOpen: boolean;
  onClose: () => void;
};

export default function SubscriberDetail({
  subscriber,
  isOpen,
  onClose,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết email đăng ký</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground mb-1">Email</p>
            <p>{subscriber.email}</p>
          </div>

          <div>
            <p className="font-medium text-muted-foreground mb-1">Trạng thái</p>
            <Badge
              variant={subscriber.status === "active" ? "default" : "secondary"}
            >
              {subscriber.status === "active" ? "Đang nhận tin" : "Đã hủy"}
            </Badge>
          </div>

          <div>
            <p className="font-medium text-muted-foreground mb-1">
              Ngày đăng ký
            </p>
            <p>{new Date(subscriber.createdAt).toLocaleString("vi-VN")}</p>
          </div>

          {subscriber.updatedAt && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">
                Cập nhật lần cuối
              </p>
              <p>{new Date(subscriber.updatedAt).toLocaleString("vi-VN")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
