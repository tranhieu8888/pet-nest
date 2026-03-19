"use client";

import { Subscriber } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Clock } from "lucide-react";

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
  const isActive = subscriber.status === "active";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {" "}
      <DialogContent className="sm:max-w-md rounded-xl">
        {" "}
        <DialogHeader>
          {" "}
          <DialogTitle className="text-lg font-semibold">
            Chi tiết đăng ký Email{" "}
          </DialogTitle>{" "}
        </DialogHeader>
        ```
        <div className="space-y-5 text-sm">
          {/* Email */}
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/40">
            <Mail className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p className="font-medium break-all">{subscriber.email}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="text-muted-foreground text-xs">Trạng thái</span>

            <Badge
              className={`px-3 py-1 text-xs ${
                isActive
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isActive ? "Đang nhận tin" : "Đã hủy"}
            </Badge>
          </div>

          {/* Created */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Ngày đăng ký</p>
              <p className="font-medium">
                {new Date(subscriber.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Updated */}
          {subscriber.updatedAt && (
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">
                  Cập nhật lần cuối
                </p>
                <p className="font-medium">
                  {new Date(subscriber.updatedAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
