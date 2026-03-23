"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonCore } from "./ButtonCore";

interface ModalCoreProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info" | "success" | "warning";
  isLoading?: boolean;
  showCancel?: boolean;
  children?: React.ReactNode;
}

export const ModalCore: React.FC<ModalCoreProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  description = "Bạn có chắc chắn muốn thực hiện hành động này không?",
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  type = "info",
  isLoading = false,
  showCancel = true,
  children,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return "bg-red-50 text-red-600";
      case "warning":
        return "bg-amber-50 text-amber-600";
      case "success":
        return "bg-emerald-50 text-emerald-600";
      default:
        return "bg-blue-50 text-blue-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertCircle className="w-10 h-10" />;
      case "warning":
        return <AlertTriangle className="w-10 h-10" />;
      case "success":
        return <CheckCircle2 className="w-10 h-10" />;
      default:
        return <Info className="w-10 h-10" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6 flex flex-col gap-4">
          {children ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-gray-500 text-base leading-relaxed px-2">
                    {description}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="mt-2">{children}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-6">
              <div
                className={cn(
                  "p-5 rounded-full transition-all duration-500 scale-100 hover:scale-110",
                  getTypeStyles(),
                )}
              >
                {getIcon()}
              </div>

              <div className="space-y-3">
                <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-base leading-relaxed px-2">
                  {description}
                </DialogDescription>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-5 flex flex-col sm:flex-row gap-3">
          {showCancel && (
            <ButtonCore
              variantType="ghost"
              onClick={onClose}
              isLoading={isLoading}
              className="flex-1 h-12 bg-white hover:shadow-sm"
            >
              {cancelText}
            </ButtonCore>
          )}
          <ButtonCore
            variantType={type}
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Đang xử lý..."
            className="flex-1 h-12"
          >
            {confirmText}
          </ButtonCore>
        </div>
      </DialogContent>
    </Dialog>
  );
};
