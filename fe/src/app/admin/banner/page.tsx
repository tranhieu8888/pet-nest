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
import { toast } from "sonner";

type TimeFilter = "all" | "activeNow" | "expired" | "upcoming";

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | undefined>();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const getBannerTimeStatus = (banner: Banner): TimeFilter | "unknown" => {
    const now = new Date();
    const start = banner.startDate ? new Date(banner.startDate) : null;
    const end = banner.endDate ? new Date(banner.endDate) : null;

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "unknown";
    }

    if (start > now) return "upcoming";
    if (end < now) return "expired";
    return "activeNow";
  };

  const filteredBanners = useMemo(() => {
  return banners.filter((banner) => {
    const keyword = searchQuery.trim().toLowerCase();

    const matchSearch =
      banner.title?.toLowerCase().includes(keyword) ||
      banner.description?.toLowerCase().includes(keyword) ||
      banner.buttonText?.toLowerCase().includes(keyword);

    const bannerTimeStatus = getBannerTimeStatus(banner);

    const matchTime =
      timeFilter === "all" ? true : bannerTimeStatus === timeFilter;

    return matchSearch && matchTime;
  });
}, [banners, searchQuery, timeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timeFilter]);

  const paginatedBanners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = currentPage * itemsPerPage;
    return filteredBanners.slice(start, end);
  }, [filteredBanners, currentPage]);

  const handleAddBanner = async (data: BannerSubmitData) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("status", data.status);
      formData.append("startDate", data.startDate);
      formData.append("endDate", data.endDate || "");
      formData.append("link", data.link || "");
      formData.append("buttonText", data.buttonText || "");
      if (data.image) formData.append("image", data.image);

      await api.post("/banners", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchBanners();
      setIsFormOpen(false);
      setSelectedBanner(undefined);

      toast.success("Tạo banner thành công");
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
      formData.append("buttonText", data.buttonText || "");
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

      toast.success("Cập nhật banner thành công");
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
      const response = await api.delete(`/banners/${id}`);

      setBanners((prev) => prev.filter((item) => item._id !== id));

      toast.success(response.data?.message || "Xóa banner thành công");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Xóa thất bại");
    }
  };

  const renderTimeBadge = (banner: Banner) => {
    const timeStatus = getBannerTimeStatus(banner);

    if (timeStatus === "activeNow") {
      return <Badge className="bg-green-100 text-green-700">Còn hạn</Badge>;
    }

    if (timeStatus === "expired") {
      return <Badge variant="destructive">Hết hạn</Badge>;
    }

    if (timeStatus === "upcoming") {
      return <Badge className="bg-blue-100 text-blue-700">Chưa bắt đầu</Badge>;
    }

    return <Badge variant="outline">Không xác định</Badge>;
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
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:flex-wrap">
            <Input
              placeholder="Tìm theo tiêu đề, mô tả hoặc text nút..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />

            <Select
              value={timeFilter}
              onValueChange={(value: TimeFilter) => setTimeFilter(value)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Lọc theo thời hạn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thời hạn</SelectItem>
                <SelectItem value="activeNow">Còn hạn</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
                <SelectItem value="upcoming">Chưa bắt đầu</SelectItem>
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
                    <TableHead>Text nút</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời hạn</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedBanners.map((banner, index) => (
                    <TableRow key={banner._id}>
                      <TableCell>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>

                      <TableCell className="max-w-[220px] truncate">
                        {banner.title}
                      </TableCell>

                      <TableCell className="max-w-[280px] truncate">
                        {banner.description || "N/A"}
                      </TableCell>

                      <TableCell>{banner.buttonText || "Xem ngay"}</TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            banner.status === "active" ? "default" : "secondary"
                          }
                        >
                          {banner.status === "active" ? "Kích hoạt" : "Tắt"}
                        </Badge>
                      </TableCell>

                      <TableCell>{renderTimeBadge(banner)}</TableCell>

                      <TableCell>
                        {banner.startDate
                          ? new Date(banner.startDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : "N/A"}
                      </TableCell>

                      <TableCell>
                        {banner.endDate
                          ? new Date(banner.endDate).toLocaleDateString("vi-VN")
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
                currentPage={currentPage}
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
