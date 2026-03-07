"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import { Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { api } from "../../../../utils/axios";
import VoucherTable from "./components/VoucherTable";
import Pagination from "./components/Pagination";
import VoucherDialogs from "./components/VoucherDialogs";
import { Voucher } from "./types";

type DiscountType = "amount" | "percent";
type StatusFilter = "all" | "active" | "expired";

type FormDataType = {
  code: string;
  discountAmount: string;
  discountPercent: string;
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

  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<FormDataType>({
    code: "",
    discountAmount: "",
    discountPercent: "",
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
      const validTo = new Date(v.validTo);

      const matchSearch = v.code?.toLowerCase().includes(keyword);

      let matchStatus = true;
      if (statusFilter === "active") matchStatus = validTo >= now;
      if (statusFilter === "expired") matchStatus = validTo < now;

      return matchSearch && matchStatus;
    });
  }, [vouchers, searchQuery, statusFilter]);

  const validateField = (
    name: keyof FormDataType,
    value: string,
    currentFormData: FormDataType = formData,
    currentDiscountType: DiscountType = discountType
  ) => {
    const voucherUsed = Number(selectedVoucher?.usedCount || 0) > 0;

    switch (name) {
      case "code":
        if (voucherUsed) return "";
        if (!String(value).trim()) return "Mã voucher không được để trống";
        return "";

      case "discountAmount":
        if (voucherUsed || currentDiscountType !== "amount") return "";
        if (value === "") return "Số tiền giảm không được để trống";
        if (Number(value) < 0 || Number.isNaN(Number(value))) {
          return "Số tiền giảm phải là số dương hoặc bằng 0";
        }
        if (Number(value) === 0) {
          return "Số tiền giảm phải lớn hơn 0";
        }
        return "";

      case "discountPercent":
        if (voucherUsed || currentDiscountType !== "percent") return "";
        if (value === "") return "Phần trăm giảm không được để trống";
        if (Number(value) < 0 || Number.isNaN(Number(value))) {
          return "Phần trăm giảm phải là số dương hoặc bằng 0";
        }
        if (Number(value) === 0) {
          return "Phần trăm giảm phải lớn hơn 0";
        }
        if (Number(value) > 100) {
          return "Phần trăm giảm không được lớn hơn 100";
        }
        return "";

      case "minOrderValue":
        if (voucherUsed) return "";
        if (value === "") return "Đơn tối thiểu không được để trống";
        if (Number(value) < 0 || Number.isNaN(Number(value))) {
          return "Đơn tối thiểu phải là số dương hoặc bằng 0";
        }
        return "";

      case "validFrom":
        if (voucherUsed) return "";
        if (!value) return "Thời gian bắt đầu không được để trống";
        if (currentFormData.validTo) {
          const start = new Date(String(value));
          const end = new Date(currentFormData.validTo);
          if (start >= end) {
            return "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc";
          }
        }
        return "";

      case "validTo":
        if (!value) return "Thời gian kết thúc không được để trống";
        const compareStart = voucherUsed
          ? new Date(selectedVoucher?.validFrom || "")
          : new Date(currentFormData.validFrom);

        const compareEnd = new Date(String(value));

        if (
          !Number.isNaN(compareStart.getTime()) &&
          compareStart >= compareEnd
        ) {
          return "Thời gian kết thúc phải lớn hơn thời gian bắt đầu";
        }
        return "";

      case "usageLimit":
        if (value === "") return "Số lượt sử dụng không được để trống";
        if (Number(value) < 0 || Number.isNaN(Number(value))) {
          return "Số lượt sử dụng phải là số dương hoặc bằng 0";
        }
        if (
          selectedVoucher &&
          Number(value) < Number(selectedVoucher.usedCount)
        ) {
          return `Số lượt sử dụng phải lớn hơn hoặc bằng ${selectedVoucher.usedCount}`;
        }
        return "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const voucherUsed = Number(selectedVoucher?.usedCount || 0) > 0;

    if (!voucherUsed) {
      for (const field of [
        "code",
        "minOrderValue",
        "validFrom",
      ] as (keyof FormDataType)[]) {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }

      if (discountType === "amount") {
        const err = validateField("discountAmount", formData.discountAmount);
        if (err) newErrors.discountAmount = err;
      }

      if (discountType === "percent") {
        const err = validateField("discountPercent", formData.discountPercent);
        if (err) newErrors.discountPercent = err;
      }
    }

    const validToError = validateField("validTo", formData.validTo);
    if (validToError) newErrors.validTo = validToError;

    const usageLimitError = validateField("usageLimit", formData.usageLimit);
    if (usageLimitError) newErrors.usageLimit = usageLimitError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (field: keyof FormDataType, value: string) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);

    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, updatedFormData, discountType),
      ...(field === "validFrom" || field === "validTo"
        ? {
            validFrom: validateField(
              "validFrom",
              updatedFormData.validFrom,
              updatedFormData,
              discountType
            ),
            validTo: validateField(
              "validTo",
              updatedFormData.validTo,
              updatedFormData,
              discountType
            ),
          }
        : {}),
    }));
  };

  const handleDiscountTypeChange = (type: DiscountType) => {
    if (Number(selectedVoucher?.usedCount || 0) > 0) return;

    setDiscountType(type);

    const nextFormData = {
      ...formData,
      discountAmount: type === "amount" ? formData.discountAmount : "",
      discountPercent: type === "percent" ? formData.discountPercent : "",
    };

    setFormData(nextFormData);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.discountAmount;
      delete newErrors.discountPercent;

      if (type === "amount") {
        newErrors.discountAmount = validateField(
          "discountAmount",
          nextFormData.discountAmount,
          nextFormData,
          type
        );
      } else {
        newErrors.discountPercent = validateField(
          "discountPercent",
          nextFormData.discountPercent,
          nextFormData,
          type
        );
      }

      return newErrors;
    });
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountAmount: "",
      discountPercent: "",
      minOrderValue: "",
      validFrom: "",
      validTo: "",
      usageLimit: "",
    });
    setDiscountType("amount");
    setErrors({});
    setSelectedVoucher(null);
  };

  const openEditDialog = (voucher: Voucher) => {
    setErrors({});
    setSelectedVoucher(voucher);

    const nextDiscountType: DiscountType =
      Number(voucher.discountPercent) > 0 ? "percent" : "amount";
    setDiscountType(nextDiscountType);

    setFormData({
      code: voucher.code,
      discountAmount: voucher.discountAmount?.toString() || "",
      discountPercent: voucher.discountPercent?.toString() || "",
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
      toast.success(response.data.message || "Xử lý thành công");
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
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        usageLimit: Number(formData.usageLimit),
        minOrderValue: Number(formData.minOrderValue),
        discountAmount:
          discountType === "amount" ? Number(formData.discountAmount) : 0,
        discountPercent:
          discountType === "percent" ? Number(formData.discountPercent) : 0,
      };

      await api.post("/vouchers", payload);
      toast.success("Tạo voucher thành công!");
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
              usageLimit: Number(formData.usageLimit),
            }
          : {
              code: formData.code.trim().toUpperCase(),
              validFrom: formData.validFrom,
              validTo: formData.validTo,
              usageLimit: Number(formData.usageLimit),
              minOrderValue: Number(formData.minOrderValue),
              discountAmount:
                discountType === "amount" ? Number(formData.discountAmount) : 0,
              discountPercent:
                discountType === "percent"
                  ? Number(formData.discountPercent)
                  : 0,
            };

      await api.put(`/vouchers/${selectedVoucher._id}`, payload);
      toast.success("Cập nhật voucher thành công!");
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
      <Toaster position="top-center" />
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
              <Plus className="mr-2 h-4 w-4" />
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
              <option value="active">Còn hạn</option>
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
        discountType={discountType}
        setDiscountType={handleDiscountTypeChange}
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
        discountType={discountType}
        setDiscountType={handleDiscountTypeChange}
        handleSubmit={handleUpdate}
        errors={errors}
        voucherUsed={Number(selectedVoucher?.usedCount || 0) > 0}
        title="Chỉnh sửa voucher"
      />
    </div>
  );
}
