"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type FormDataType = {
  code: string;
  discountPercent: string;
  maxDiscountAmount: string;
  minOrderValue: string;
  validFrom: string;
  validTo: string;
  usageLimit: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  formData: FormDataType;
  setFormData: (field: keyof FormDataType, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  errors: Record<string, string>;
  voucherUsed: boolean;
  title: string;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-500">{message}</p>;
}

export default function VoucherDialogs({
  open,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  errors,
  voucherUsed,
  title,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {voucherUsed && (
            <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-700">
              Voucher đã được sử dụng. Chỉ có thể sửa ngày kết thúc.
            </div>
          )}

          <div className="space-y-2">
            <Label>Mã voucher</Label>
            <Input
              disabled={voucherUsed}
              value={formData.code}
              onChange={(e) =>
                setFormData("code", e.target.value.toUpperCase())
              }
            />
            <FieldError message={errors.code} />
          </div>

          <div className="space-y-2">
            <Label>% giảm</Label>
            <Input
              type="number"
              min={0}
              max={100}
              disabled={voucherUsed}
              value={formData.discountPercent}
              onChange={(e) => setFormData("discountPercent", e.target.value)}
            />
            <FieldError message={errors.discountPercent} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Giảm tối đa</Label>
              {formData.maxDiscountAmount && !isNaN(Number(formData.maxDiscountAmount)) && (
                <span className="text-xs font-medium text-pink-600">
                  {Number(formData.maxDiscountAmount).toLocaleString("vi-VN")}đ
                </span>
              )}
            </div>
            <Input
              type="number"
              min={0}
              disabled={voucherUsed}
              value={formData.maxDiscountAmount}
              onChange={(e) => setFormData("maxDiscountAmount", e.target.value)}
            />
            <FieldError message={errors.maxDiscountAmount} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Đơn tối thiểu</Label>
              {formData.minOrderValue && !isNaN(Number(formData.minOrderValue)) && (
                <span className="text-xs font-medium text-pink-600">
                  {Number(formData.minOrderValue).toLocaleString("vi-VN")}đ
                </span>
              )}
            </div>
            <Input
              type="number"
              min={0}
              disabled={voucherUsed}
              value={formData.minOrderValue}
              onChange={(e) => setFormData("minOrderValue", e.target.value)}
            />
            <FieldError message={errors.minOrderValue} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thời gian bắt đầu</Label>
              <Input
                disabled={voucherUsed}
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData("validFrom", e.target.value)}
              />
              <FieldError message={errors.validFrom} />
            </div>

            <div className="space-y-2">
              <Label>Thời gian kết thúc</Label>
              <Input
                type="datetime-local"
                value={formData.validTo}
                onChange={(e) => setFormData("validTo", e.target.value)}
              />
              <FieldError message={errors.validTo} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Số lượt dùng</Label>
            <Input
              type="number"
              min={0}
              disabled={voucherUsed}
              value={formData.usageLimit}
              onChange={(e) => setFormData("usageLimit", e.target.value)}
            />
            <FieldError message={errors.usageLimit} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
