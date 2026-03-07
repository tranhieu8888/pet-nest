"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Eye, Trash2 } from "lucide-react";

import { api } from "../../../../utils/axios";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import BannerForm from "./components/BannerForm";
import BannerDetail from "./components/BannerDetail";
import Pagination from "./components/Pagination";
import { Banner, BannerSubmitData } from "./types";

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | undefined>();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/banners");
      setBanners(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const keyword = searchQuery.trim().toLowerCase();

      const matchSearch =
        banner.title?.toLowerCase().includes(keyword) ||
        banner.description?.toLowerCase().includes(keyword);

      const matchStatus =
        statusFilter === "all" ? true : banner.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [banners, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const paginatedBanners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = currentPage * itemsPerPage;
    return filteredBanners.slice(start, end);
  }, [filteredBanners, currentPage, itemsPerPage]);

  const handleAddBanner = async (data: BannerSubmitData) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("status", data.status);
      formData.append("startDate", data.startDate);
      formData.append("endDate", data.endDate || "");
      formData.append("link", data.link || "");
      if (data.image) formData.append("image", data.image);

      await api.post("/banners", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchBanners();
      setIsFormOpen(false);
      setSelectedBanner(undefined);
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message || err.message || "Thêm thất bại"
      );
    }
  };

  const handleEditBanner = async (data: BannerSubmitData) => {
    if (!selectedBanner) return;

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("status", data.status);
      formData.append("startDate", data.startDate);
      formData.append("endDate", data.endDate || "");
      formData.append("link", data.link || "");
      if (data.image) formData.append("image", data.image);

      const response = await api.put(
        `/banners/${selectedBanner._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setBanners((prev) =>
        prev.map((item) =>
          item._id === selectedBanner._id ? response.data : item
        )
      );

      setIsFormOpen(false);
      setSelectedBanner(undefined);
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message || err.message || "Cập nhật thất bại"
      );
    }
  };

  const handleDeleteBanner = async (id: string) => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa banner này không?"
    );
    if (!confirmed) return;

    try {
      await api.delete(`/banners/${id}`);
      setBanners((prev) => prev.filter((item) => item._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Xóa thất bại");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Quản lý quảng cáo</CardTitle>

            <Button
              onClick={() => {
                setSelectedBanner(undefined);
                setIsFormOpen(true);
              }}
            >
              Thêm Mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <Input
              placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />

            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "active" | "inactive") =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Kích hoạt</SelectItem>
                <SelectItem value="inactive">Tắt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div>Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-600">
              {error}
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="py-10 text-center text-base font-medium text-gray-500">
              Không có quảng cáo phù hợp!
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedBanners.map((banner, index) => (
                    <TableRow key={banner._id}>
                      <TableCell>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>

                      <TableCell className="font-medium">
                        {banner.title}
                      </TableCell>

                      <TableCell className="max-w-[280px] truncate">
                        {banner.description || "N/A"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            banner.status === "active" ? "default" : "secondary"
                          }
                        >
                          {banner.status === "active" ? "Kích hoạt" : "Tắt"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {banner.startDate
                          ? new Date(banner.startDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : "N/A"}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Xem chi tiết"
                            onClick={() => {
                              setSelectedBanner(banner);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Chỉnh sửa"
                            onClick={() => {
                              setSelectedBanner(banner);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Xóa"
                            onClick={() => handleDeleteBanner(banner._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                totalItems={filteredBanners.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setItemsPerPage={setItemsPerPage}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <BannerForm
        banner={selectedBanner}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedBanner(undefined);
        }}
        onSubmit={selectedBanner ? handleEditBanner : handleAddBanner}
      />

      {selectedBanner && (
        <BannerDetail
          banner={selectedBanner}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedBanner(undefined);
          }}
        />
      )}
    </div>
  );
}
