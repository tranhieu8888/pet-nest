"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Banner } from "../types";

interface BannerDetailProps {
  banner: Banner;
  isOpen: boolean;
  onClose: () => void;
}

export default function BannerDetail({
  banner,
  isOpen,
  onClose,
}: BannerDetailProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-2xl font-bold">
            Chi tiết quảng cáo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <Label className="text-sm font-semibold text-gray-500">
              Tiêu đề
            </Label>
            <p className="mt-2 text-base font-semibold text-gray-900">
              {banner.title}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <Label className="text-sm font-semibold text-gray-500">Mô tả</Label>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {banner.description || "N/A"}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <Label className="text-sm font-semibold text-gray-500">Ảnh</Label>

            {banner.imageUrl ? (
              <div className="mt-4 flex justify-center">
                <div className="flex h-[260px] w-full max-w-md items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="max-h-[220px] w-auto max-w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-700">N/A</p>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <Label className="text-sm font-semibold text-gray-500">
              Text nút
            </Label>
            <p className="mt-2 text-sm text-gray-700">
              {banner.buttonText || "Xem ngay"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <Label className="text-sm font-semibold text-gray-500">
                Trạng thái
              </Label>
              <div className="mt-2">
                <Badge
                  className={
                    banner.status === "active"
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-200"
                  }
                >
                  {banner.status === "active" ? "Kích hoạt" : "Tắt"}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <Label className="text-sm font-semibold text-gray-500">
                Ngày bắt đầu
              </Label>
              <p className="mt-2 text-sm text-gray-700">
                {banner.startDate
                  ? new Date(banner.startDate).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <Label className="text-sm font-semibold text-gray-500">
                Ngày kết thúc
              </Label>
              <p className="mt-2 text-sm text-gray-700">
                {banner.endDate
                  ? new Date(banner.endDate).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <Label className="text-sm font-semibold text-gray-500">
                Link
              </Label>
              <p className="mt-2 break-all text-sm text-blue-600">
                {banner.link || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="min-w-[100px]"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
