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
  discountAmount: string;
  discountPercent: string;
  validFrom: string;
  validTo: string;
  usageLimit: string;
  isActive: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
  formData: FormDataType;
  setFormData: (field: keyof FormDataType, value: string | boolean) => void;
  discountType: "amount" | "percent";
  setDiscountType: (v: "amount" | "percent") => void;
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
  discountType,
  setDiscountType,
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
              Voucher đã được sử dụng. Chỉ có thể sửa ngày kết thúc, số lượt
              dùng và trạng thái kích hoạt.
            </div>
          )}

          <div>
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

          <div>
            <Label>Loại giảm giá</Label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={discountType === "amount"}
                  disabled={voucherUsed}
                  onChange={() => setDiscountType("amount")}
                />
                Giảm tiền
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={discountType === "percent"}
                  disabled={voucherUsed}
                  onChange={() => setDiscountType("percent")}
                />
                Giảm %
              </label>
            </div>
          </div>

          {discountType === "amount" && (
            <div>
              <Label>Số tiền giảm</Label>
              <Input
                type="number"
                min={0}
                disabled={voucherUsed}
                value={formData.discountAmount}
                onChange={(e) => setFormData("discountAmount", e.target.value)}
              />
              <FieldError message={errors.discountAmount} />
            </div>
          )}

          {discountType === "percent" && (
            <div>
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Thời gian bắt đầu</Label>
              <Input
                disabled={voucherUsed}
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData("validFrom", e.target.value)}
              />
              <FieldError message={errors.validFrom} />
            </div>

            <div>
              <Label>Thời gian kết thúc</Label>
              <Input
                type="datetime-local"
                value={formData.validTo}
                onChange={(e) => setFormData("validTo", e.target.value)}
              />
              <FieldError message={errors.validTo} />
            </div>
          </div>

          <div>
            <Label>Số lượt dùng</Label>
            <Input
              type="number"
              min={0}
              value={formData.usageLimit}
              onChange={(e) => setFormData("usageLimit", e.target.value)}
            />
            <FieldError message={errors.usageLimit} />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData("isActive", e.target.checked)}
              />
              Kích hoạt voucher
            </label>
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
