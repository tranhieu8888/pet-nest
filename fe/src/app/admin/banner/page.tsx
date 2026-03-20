"use client";

import { Edit, Eye, Trash2 } from "lucide-react";
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
import AdminPagination from "../components/AdminPagination";
import { useBanners, TimeFilter } from "./hooks/useBanners";
import { Banner } from "./types";

const ITEMS_PER_PAGE = 7;

export default function BannerPage() {
  const {
    banners,
    paginatedBanners,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    timeFilter,
    setTimeFilter,
    currentPage,
    setCurrentPage,
    isFormOpen,
    isDetailOpen,
    selectedBanner,
    addBanner,
    editBanner,
    deleteBanner,
    handleOpenForm,
    handleOpenDetail,
    handleCloseAll,
    getBannerTimeStatus
  } = useBanners(ITEMS_PER_PAGE);

  const renderTimeBadge = (banner: Banner) => {
    const timeStatus = getBannerTimeStatus(banner);

    switch (timeStatus) {
      case "activeNow":
        return <Badge className="bg-green-100 text-green-700 border-none">Còn hạn</Badge>;
      case "expired":
        return <Badge variant="destructive" className="border-none">Hết hạn</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-700 border-none">Chưa bắt đầu</Badge>;
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Quản lý quảng cáo (Banner)</CardTitle>
            <Button onClick={() => handleOpenForm()}>Thêm Banner Mới</Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:flex-wrap">
            <Input
              placeholder="Tìm theo tiêu đề, text nút..."
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
            <div className="flex justify-center h-48 items-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-6 text-red-600 text-center">
              {error}
            </div>
          ) : banners.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground italic">
              Không tìm thấy quảng cáo nào phù hợp!
            </div>
          ) : (
            <>
              <Table className="border rounded-md">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16 text-center font-bold">STT</TableHead>
                    <TableHead className="font-bold">Tiêu đề</TableHead>
                    <TableHead className="font-bold">Nút bấm</TableHead>
                    <TableHead className="text-center font-bold">Trạng thái</TableHead>
                    <TableHead className="text-center font-bold">Thời hạn</TableHead>
                    <TableHead className="text-center font-bold">Thời gian áp dụng</TableHead>
                    <TableHead className="text-right font-bold w-40">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedBanners.map((banner, index) => (
                    <TableRow key={banner._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>

                      <TableCell className="max-w-[200px] truncate font-medium">
                        {banner.title}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-normal text-xs">
                          {banner.buttonText || "Xem ngay"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          className={
                            banner.status === "active"
                              ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
                          }
                        >
                          {banner.status === "active" ? "Kích hoạt" : "Vô hiệu"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">{renderTimeBadge(banner)}</TableCell>

                      <TableCell className="text-center text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span>BĐ: {banner.startDate ? new Date(banner.startDate).toLocaleDateString("vi-VN") : "N/A"}</span>
                          <span>KT: {banner.endDate ? new Date(banner.endDate).toLocaleDateString("vi-VN") : "N/A"}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleOpenDetail(banner)}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => handleOpenForm(banner)}
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteBanner(banner._id)}
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <AdminPagination
                totalItems={banners.length}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <BannerForm
        banner={selectedBanner}
        isOpen={isFormOpen}
        onClose={handleCloseAll}
        onSubmit={selectedBanner ? editBanner : addBanner}
      />

      {selectedBanner && (
        <BannerDetail
          banner={selectedBanner}
          isOpen={isDetailOpen}
          onClose={handleCloseAll}
        />
      )}
    </div>
  );
}
