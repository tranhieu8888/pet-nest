"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";

import { api } from "../../../../utils/axios";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type SpaCategory = "spa" | "cleaning" | "grooming" | "coloring";
type PetType = "dog" | "cat";

interface SpaService {
  _id: string;
  name: string;
  slug: string;
  category: SpaCategory;
  description: string;
  petTypes: PetType[];
  price: number;
  durationMinutes: number;
  image: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SpaServiceFormData {
  name: string;
  slug: string;
  category: SpaCategory;
  description: string;
  petTypes: PetType[];
  price: string;
  durationMinutes: string;
  imageFile: File | null;
  imagePreview: string;
  isActive: boolean;
}

interface SpaServiceListResponse {
  success: boolean;
  data: SpaService[];
  total: number;
  page: number;
  limit: number;
}

const defaultForm: SpaServiceFormData = {
  name: "",
  slug: "",
  category: "spa",
  description: "",
  petTypes: [],
  price: "",
  durationMinutes: "",
  imageFile: null,
  imagePreview: "",
  isActive: true,
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatCurrency(value: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0 VNĐ";
  return value.toLocaleString("vi-VN") + " VNĐ";
}

function formatCurrencyPreview(value: string) {
  const numeric = Number(String(value || "").replace(/[^\d]/g, ""));
  if (Number.isNaN(numeric)) return "";
  return numeric.toLocaleString("vi-VN") + " VNĐ";
}

function getCategoryLabel(category: SpaCategory) {
  switch (category) {
    case "spa":
      return "Spa";
    case "cleaning":
      return "Tắm rửa";
    case "grooming":
      return "Cắt tỉa";
    case "coloring":
      return "Nhuộm lông";
    default:
      return category;
  }
}

function getStatusBadge(isActive: boolean) {
  return isActive ? (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
      Đang hoạt động
    </Badge>
  ) : (
    <Badge variant="secondary">Đang ẩn</Badge>
  );
}

function getImageUrl(url?: string) {
  if (!url || typeof url !== "string") return "/placeholder.svg";

  const trimmed = url.trim();
  if (!trimmed) return "/placeholder.svg";

  if (trimmed.startsWith("blob:")) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const serverUrlRaw = process.env.NEXT_PUBLIC_SERVER_URL?.trim();

  const serverUrl =
    serverUrlRaw && /^https?:\/\//i.test(serverUrlRaw)
      ? serverUrlRaw.replace(/\/+$/, "")
      : "http://localhost:5000";

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  try {
    return new URL(normalizedPath, serverUrl).toString();
  } catch {
    return "/placeholder.svg";
  }
}

export default function AdminSpaServicePage() {
  const [services, setServices] = useState<SpaService[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | SpaCategory>(
    "all"
  );

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<SpaService | null>(
    null
  );

  const fetchServices = async (customPage?: number, customLimit?: number) => {
    const currentPage = customPage ?? page;
    const currentLimit = customLimit ?? limit;

    try {
      setLoading(true);

      const res = await api.get<SpaServiceListResponse>("/admin/spa-services", {
        params: {
          page: currentPage,
          limit: currentLimit,
          search: search.trim() || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        },
      });

      setServices(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error("Fetch spa services error:", error);
      toast.error("Không thể tải danh sách dịch vụ spa");
      setServices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchServices(1, limit);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa dịch vụ spa này không?")) {
      return;
    }

    try {
      const res = await api.delete(`/admin/spa-services/${id}`);
      toast.success(res.data?.message || "Xóa dịch vụ thành công");

      const remaining = total - 1;
      const nextTotalPages = Math.max(1, Math.ceil(remaining / limit));

      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      } else {
        fetchServices(page, limit);
      }
    } catch (error) {
      console.error("Delete spa service error:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || "Xóa dịch vụ thất bại");
    }
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setSelectedService(null);
    fetchServices(page, limit);
  };

  const displayRangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const displayRangeEnd = Math.min(page * limit, total);

  const categorySummary = useMemo(() => total, [total]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Quản lý dịch vụ spa</CardTitle>

            <Button
              onClick={() => {
                setSelectedService(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center w-full">
              <Input
                placeholder="Tìm theo tên, slug, mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-[340px]"
              />

              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as "all" | SpaCategory)
                }
              >
                <option value="all">Tất cả danh mục</option>
                <option value="spa">Spa</option>
                <option value="cleaning">Tắm rửa</option>
                <option value="grooming">Cắt tỉa</option>
                <option value="coloring">Nhuộm lông</option>
              </select>

              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setPage(1);
                  setLimit(newLimit);
                }}
              >
                <option value={5}>5 dòng</option>
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>

            <div className="text-sm text-muted-foreground">
              Tổng: <b>{categorySummary}</b> dịch vụ
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">
              Đang tải dữ liệu...
            </div>
          ) : services.length === 0 ? (
            <div className="py-10 text-center text-base font-medium text-muted-foreground">
              Không có dịch vụ phù hợp
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Ảnh</TableHead>
                    <TableHead>Tên dịch vụ</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Thú cưng</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Thời lượng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {services.map((service, index) => (
                    <TableRow key={service._id}>
                      <TableCell>{(page - 1) * limit + index + 1}</TableCell>

                      <TableCell>
                        <div className="relative h-14 w-14 overflow-hidden rounded-md border bg-gray-50">
                          <Image
                            src={getImageUrl(service.image)}
                            alt={service.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        </div>
                      </TableCell>

                      <TableCell className="max-w-[220px] truncate font-medium">
                        {service.name}
                      </TableCell>

                      <TableCell className="max-w-[180px] truncate">
                        {service.slug}
                      </TableCell>

                      <TableCell>
                        {getCategoryLabel(service.category)}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {service.petTypes?.length > 0 ? (
                            service.petTypes.map((pet) => (
                              <Badge key={pet} variant="outline">
                                {pet === "dog" ? "Chó" : "Mèo"}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{formatCurrency(service.price)}</TableCell>
                      <TableCell>{service.durationMinutes} phút</TableCell>
                      <TableCell>{getStatusBadge(service.isActive)}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedService(service);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedService(service);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(service._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Hiển thị <b>{displayRangeStart}</b> - <b>{displayRangeEnd}</b>{" "}
                  trên <b>{total}</b> bản ghi
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Trước
                  </Button>

                  <div className="px-2 text-sm text-muted-foreground">
                    Trang <b>{page}</b> / <b>{totalPages}</b>
                  </div>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SpaServiceFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedService(null);
        }}
        editing={selectedService}
        onSuccess={handleSuccess}
      />

      <SpaServiceDetailDialog
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedService(null);
        }}
        service={selectedService}
      />
    </div>
  );
}

function SpaServiceFormDialog({
  open,
  onClose,
  editing,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  editing: SpaService | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<SpaServiceFormData>(defaultForm);
  const [loading, setLoading] = useState(false);

  const isEditing = !!editing?._id;

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setForm({
        name: editing.name || "",
        slug: editing.slug || "",
        category: editing.category || "spa",
        description: editing.description || "",
        petTypes: Array.isArray(editing.petTypes) ? editing.petTypes : [],
        price: String(editing.price ?? ""),
        durationMinutes: String(editing.durationMinutes ?? ""),
        imageFile: null,
        imagePreview: editing.image ? getImageUrl(editing.image) : "",
        isActive: !!editing.isActive,
      });
    } else {
      setForm({ ...defaultForm });
    }
  }, [editing, open]);

  useEffect(() => {
    return () => {
      if (form.imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(form.imagePreview);
      }
    };
  }, [form.imagePreview]);

  const handleTogglePetType = (petType: PetType) => {
    setForm((prev) => {
      const exists = prev.petTypes.includes(petType);

      return {
        ...prev,
        petTypes: exists
          ? prev.petTypes.filter((item) => item !== petType)
          : [...prev.petTypes, petType],
      };
    });
  };

  const handleChooseImage = (file?: File | null) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => {
      if (prev.imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(prev.imagePreview);
      }

      return {
        ...prev,
        imageFile: file,
        imagePreview: previewUrl,
      };
    });
  };

  const clearSelectedImage = () => {
    setForm((prev) => {
      if (prev.imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(prev.imagePreview);
      }

      return {
        ...prev,
        imageFile: null,
        imagePreview: editing?.image ? getImageUrl(editing.image) : "",
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên dịch vụ");
      return;
    }

    if (!form.slug.trim()) {
      toast.error("Vui lòng nhập slug");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      toast.error("Giá dịch vụ không hợp lệ");
      return;
    }

    if (!form.durationMinutes || Number(form.durationMinutes) < 1) {
      toast.error("Thời lượng phải lớn hơn 0");
      return;
    }

    if (form.petTypes.length === 0) {
      toast.error("Vui lòng chọn ít nhất một loại thú cưng");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("slug", normalizeSlug(form.slug || form.name));
    formData.append("category", form.category);
    formData.append("description", form.description.trim());
    formData.append("petTypes", JSON.stringify(form.petTypes));
    formData.append("price", String(Number(form.price)));
    formData.append("durationMinutes", String(Number(form.durationMinutes)));
    formData.append("isActive", String(form.isActive));

    if (form.imageFile) {
      formData.append("image", form.imageFile);
    }

    try {
      if (isEditing && editing?._id) {
        await api.put(`/admin/spa-services/${editing._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Cập nhật dịch vụ thành công");
      } else {
        await api.post("/admin/spa-services", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Tạo dịch vụ thành công");
      }

      onSuccess();
    } catch (error) {
      console.error("Save spa service error:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || "Lưu dịch vụ thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="w-[95vw] max-w-[860px] max-h-[90vh] overflow-hidden rounded-2xl p-0">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              {isEditing ? "Cập nhật dịch vụ spa" : "Thêm mới dịch vụ spa"}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Tên dịch vụ</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const nextName = e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      name: nextName,
                      slug: normalizeSlug(nextName),
                    }));
                  }}
                  placeholder="Ví dụ: Tắm spa cao cấp"
                />
              </div>

              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      slug: normalizeSlug(e.target.value),
                    }))
                  }
                  placeholder="tam-spa-cao-cap"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Danh mục</Label>
                  <select
                    className="mt-2 h-10 w-full rounded-md border bg-white px-3 text-sm"
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value as SpaCategory,
                      }))
                    }
                  >
                    <option value="spa">Spa</option>
                    <option value="cleaning">Tắm rửa</option>
                    <option value="grooming">Cắt tỉa</option>
                    <option value="coloring">Nhuộm lông</option>
                  </select>
                </div>

                <div>
                  <Label>Trạng thái</Label>
                  <select
                    className="mt-2 h-10 w-full rounded-md border bg-white px-3 text-sm"
                    value={form.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: e.target.value === "active",
                      }))
                    }
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đang ẩn</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Giá dịch vụ (VNĐ)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        price: e.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    placeholder="100000"
                  />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {form.price
                      ? `Xem trước: ${formatCurrencyPreview(form.price)}`
                      : "Nhập giá dịch vụ"}
                  </div>
                </div>

                <div>
                  <Label>Thời lượng (phút)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        durationMinutes: e.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <Label>Loại thú cưng áp dụng</Label>
                <div className="mt-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.petTypes.includes("dog")}
                      onChange={() => handleTogglePetType("dog")}
                    />
                    Chó
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.petTypes.includes("cat")}
                      onChange={() => handleTogglePetType("cat")}
                    />
                    Mèo
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                <div>
                  <Label>Ảnh dịch vụ</Label>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="mt-2 block w-full text-sm"
                    onChange={(e) =>
                      handleChooseImage(e.target.files?.[0] || null)
                    }
                  />

                  <div className="mt-2 text-xs text-muted-foreground">
                    Chấp nhận jpg, jpeg, png, webp. Tối đa 5MB.
                  </div>

                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSelectedImage}
                      disabled={!form.imagePreview && !form.imageFile}
                    >
                      Bỏ ảnh vừa chọn
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Xem trước ảnh</Label>
                  <div className="mt-2 h-[220px] w-full overflow-hidden rounded-xl border bg-gray-50">
                    {form.imagePreview ? (
                      <img
                        src={form.imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>Mô tả</Label>
                <textarea
                  className="mt-2 min-h-[120px] w-full rounded-md border px-3 py-2 text-sm outline-none"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả dịch vụ..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Hủy
                </Button>

                <Button type="submit" disabled={loading}>
                  {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpaServiceDetailDialog({
  open,
  onClose,
  service,
}: {
  open: boolean;
  onClose: () => void;
  service: SpaService | null;
}) {
  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[88vh] w-[90vw] max-w-[620px] overflow-y-auto rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle>Chi tiết dịch vụ spa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative h-52 w-full overflow-hidden rounded-lg border bg-gray-50">
            <Image
              src={getImageUrl(service.image)}
              alt={service.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 520px"
              unoptimized
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Tên dịch vụ</p>
              <p className="font-medium">{service.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{service.slug}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Danh mục</p>
              <p className="font-medium">
                {getCategoryLabel(service.category)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <div className="pt-1">{getStatusBadge(service.isActive)}</div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Giá dịch vụ</p>
              <p className="font-medium">{formatCurrency(service.price)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Thời lượng</p>
              <p className="font-medium">{service.durationMinutes} phút</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Loại thú cưng áp dụng
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {service.petTypes?.length > 0 ? (
                service.petTypes.map((pet) => (
                  <Badge key={pet} variant="outline">
                    {pet === "dog" ? "Chó" : "Mèo"}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Mô tả</p>
            <p className="whitespace-pre-line rounded-md border p-3 text-sm">
              {service.description || "Không có mô tả"}
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
