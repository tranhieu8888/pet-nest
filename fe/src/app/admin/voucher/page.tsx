"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { api } from "../../../../utils/axios";
import VoucherTable from "./components/VoucherTable";
import Pagination from "./components/Pagination";
import VoucherDialogs from "./components/VoucherDialogs";
import { Voucher } from "./types";

type StatusFilter = "all" | "upcoming" | "active" | "expired";

type FormDataType = {
  code: string;
  discountPercent: string;
  maxDiscountAmount: string;
  minOrderValue: string;
  validFrom: string;
  validTo: string;
  usageLimit: string;
};

export default function VoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<FormDataType>({
    code: "",
    discountPercent: "",
    maxDiscountAmount: "",
    minOrderValue: "",
    validFrom: "",
    validTo: "",
    usageLimit: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchVouchers = async () => {
    const response = await api.get("/vouchers");
    setVouchers(
      Array.isArray(response.data) ? response.data : response.data.data
    );
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const keyword = searchQuery.trim().toLowerCase();
      const now = new Date();
      const validFrom = new Date(v.validFrom);
      const validTo = new Date(v.validTo);

      const matchSearch = v.code?.toLowerCase().includes(keyword);

      let matchStatus = true;

      if (statusFilter === "upcoming") {
        matchStatus = validFrom > now;
      }

      if (statusFilter === "active") {
        matchStatus = validFrom <= now && validTo >= now;
      }

      if (statusFilter === "expired") {
        matchStatus = validTo < now;
      }

      return matchSearch && matchStatus;
    });
  }, [vouchers, searchQuery, statusFilter]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const voucherUsed = Number(selectedVoucher?.usedCount || 0) > 0;

    if (!voucherUsed) {
      if (!formData.code.trim())
        newErrors.code = "Mã voucher không được để trống";
      if (!formData.discountPercent.trim()) {
        newErrors.discountPercent = "Phần trăm giảm không được để trống";
      }
      if (!formData.maxDiscountAmount.trim()) {
        newErrors.maxDiscountAmount = "Giảm tối đa không được để trống";
      }
      if (!formData.minOrderValue.trim()) {
        newErrors.minOrderValue = "Đơn tối thiểu không được để trống";
      }
      if (!formData.validFrom.trim()) {
        newErrors.validFrom = "Thời gian bắt đầu không được để trống";
      }
      if (!formData.usageLimit.trim()) {
        newErrors.usageLimit = "Số lượt sử dụng không được để trống";
      }
    }

    if (!formData.validTo.trim()) {
      newErrors.validTo = "Thời gian kết thúc không được để trống";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountPercent: "",
      maxDiscountAmount: "",
      minOrderValue: "",
      validFrom: "",
      validTo: "",
      usageLimit: "",
    });
    setErrors({});
    setSelectedVoucher(null);
  };

  const openEditDialog = (voucher: Voucher) => {
    setErrors({});
    setSelectedVoucher(voucher);

    setFormData({
      code: voucher.code,
      discountPercent: voucher.discountPercent?.toString() || "",
      maxDiscountAmount: voucher.maxDiscountAmount?.toString() || "",
      minOrderValue: voucher.minOrderValue?.toString() || "",
      validFrom: format(new Date(voucher.validFrom), "yyyy-MM-dd'T'HH:mm"),
      validTo: format(new Date(voucher.validTo), "yyyy-MM-dd'T'HH:mm"),
      usageLimit: voucher.usageLimit.toString(),
    });

    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa voucher này?");
    if (!confirmed) return;

    try {
      const response = await api.delete(`/vouchers/${id}`);
      toast.success(response.data.message || "Xóa voucher thành công");
      fetchVouchers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Xử lý thất bại");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountPercent: Number(formData.discountPercent),
        maxDiscountAmount: Number(formData.maxDiscountAmount),
        minOrderValue: Number(formData.minOrderValue),
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        usageLimit: Number(formData.usageLimit),
      };

      await api.post("/vouchers", payload);
      toast.success("Tạo voucher thành công");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchVouchers();
    } catch (error: any) {
      const backendErrors = error?.response?.data?.errors;
      if (backendErrors) {
        setErrors(backendErrors);
      } else {
        toast.error(error?.response?.data?.message || "Tạo voucher thất bại");
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucher) return;
    if (!validateForm()) return;

    try {
      const payload =
        Number(selectedVoucher.usedCount || 0) > 0
          ? {
              validTo: formData.validTo,
            }
          : {
              code: formData.code.trim().toUpperCase(),
              discountPercent: Number(formData.discountPercent),
              maxDiscountAmount: Number(formData.maxDiscountAmount),
              minOrderValue: Number(formData.minOrderValue),
              validFrom: formData.validFrom,
              validTo: formData.validTo,
              usageLimit: Number(formData.usageLimit),
            };

      await api.put(`/vouchers/${selectedVoucher._id}`, payload);
      toast.success("Cập nhật voucher thành công");
      setIsEditDialogOpen(false);
      resetForm();
      fetchVouchers();
    } catch (error: any) {
      const backendErrors = error?.response?.data?.errors;
      if (backendErrors) {
        setErrors(backendErrors);
      } else {
        toast.error(
          error?.response?.data?.message || "Cập nhật voucher thất bại"
        );
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quản lý mã giảm giá</CardTitle>

            <Button
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
            >
              Thêm Mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Tìm kiếm mã voucher..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="upcoming">Chưa diễn ra</option>
              <option value="active">Đang diễn ra</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>

          <VoucherTable
            vouchers={filteredVouchers.slice(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage
            )}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            openEditDialog={openEditDialog}
            handleDelete={handleDelete}
          />

          <Pagination
            filteredVouchers={filteredVouchers}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </CardContent>
      </Card>

      <VoucherDialogs
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        formData={formData}
        setFormData={handleFormChange}
        handleSubmit={handleCreate}
        errors={errors}
        voucherUsed={false}
        title="Thêm voucher mới"
      />

      <VoucherDialogs
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        formData={formData}
        setFormData={handleFormChange}
        handleSubmit={handleUpdate}
        errors={errors}
        voucherUsed={Number(selectedVoucher?.usedCount || 0) > 0}
        title="Chỉnh sửa voucher"
      />
    </div>
  );
}
