"use client";

import { RefreshCcw, Mail, Eye, Trash2 } from "lucide-react";
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

import SubscriberDetail from "./components/SubscriberDetail";
import AdminPagination from "../components/AdminPagination";
import { useSubscribers } from "./hooks/useSubscribers";

const ITEMS_PER_PAGE = 5;

export default function SubscribersPage() {
  const {
    subscribers,
    paginatedSubscribers,
    loading,
    searchQuery,
    currentPage,
    selectedSubscriber,
    isDetailOpen,
    setCurrentPage,
    handleSearchChange,
    handleOpenDetail,
    handleCloseDetail,
    toggleStatus,
    deleteSubscriber,
    refresh
  } = useSubscribers(ITEMS_PER_PAGE);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Quản lý Email đăng ký</CardTitle>
            <Button onClick={refresh}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Tìm kiếm theo email hoặc trạng thái..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center h-48 items-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <Table className="w-full table-fixed border rounded-md">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16 text-center font-bold">STT</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="w-36 text-center font-bold">Trạng thái</TableHead>
                    <TableHead className="w-40 text-center font-bold">Ngày đăng ký</TableHead>
                    <TableHead className="w-36 text-right font-bold">Hành động</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                        Không tìm thấy email đăng ký phù hợp!
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSubscribers.map((subscriber, index) => (
                      <TableRow key={subscriber._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-center">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>

                        <TableCell className="truncate">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">{subscriber.email}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            className={`px-2 py-0.5 rounded-full ${
                              subscriber.status === "active"
                                ? "bg-green-100 text-green-700 hover:bg-green-200 border-none"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
                            }`}
                          >
                            {subscriber.status === "active" ? "Đang nhận tin" : "Đã hủy"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center text-muted-foreground whitespace-nowrap">
                          {new Date(subscriber.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenDetail(subscriber)}
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={() => toggleStatus(subscriber)}
                              title="Đổi trạng thái"
                            >
                              <RefreshCcw size={16} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteSubscriber(subscriber._id)}
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <AdminPagination
                totalItems={subscribers.length}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {selectedSubscriber && (
        <SubscriberDetail
          subscriber={selectedSubscriber}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
