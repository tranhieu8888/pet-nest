"use client";

import { useEffect, useState } from "react";
import { Eye, Trash2, RefreshCcw, Mail } from "lucide-react";
import { toast } from "sonner";

import { api, useApi } from "../../../../utils/axios";

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
import Pagination from "./components/Pagination";
import { Subscriber } from "./types";

export default function SubscribersPage() {
  const { request } = useApi();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSubscriber, setSelectedSubscriber] = useState<
    Subscriber | undefined
  >();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await request(() => api.get("/subscribers"));

      if (response.success) {
        setSubscribers(response.data || []);
      } else {
        toast.error(
          response.message || "Không thể tải danh sách email đăng ký"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách email đăng ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const filteredSubscribers = subscribers.filter(
    (subscriber) =>
      subscriber.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscriber.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (subscriber: Subscriber) => {
    try {
      const endpoint =
        subscriber.status === "active"
          ? `/subscribers/${subscriber._id}/unsubscribe`
          : `/subscribers/${subscriber._id}/activate`;

      const response = await request(() => api.patch(endpoint));

      if (response.success) {
        await fetchSubscribers();
        toast.success(
          subscriber.status === "active"
            ? "Đã hủy đăng ký email"
            : "Đã kích hoạt lại email"
        );
      } else {
        toast.error(response.message || "Cập nhật trạng thái thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Cập nhật trạng thái thất bại");
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    try {
      if (!window.confirm("Bạn có chắc muốn xoá email đăng ký này?")) return;

      const response = await request(() => api.delete(`/subscribers/${id}`));

      if (response.success) {
        await fetchSubscribers();
        toast.success("Xóa email đăng ký thành công");
      } else {
        toast.error(response.message || "Xóa email đăng ký thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Xóa email đăng ký thất bại");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Quản lý Email đăng ký</CardTitle>

            <Button onClick={fetchSubscribers}>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center h-32 items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">STT</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-36 text-center">
                      Trạng thái
                    </TableHead>
                    <TableHead className="w-40 text-center">
                      Ngày đăng ký
                    </TableHead>
                    <TableHead className="w-36 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4 + 1}
                        className="text-center py-6 text-gray-500"
                      >
                        Không có email đăng ký phù hợp!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscribers
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((subscriber, index) => (
                        <TableRow key={subscriber._id}>
                          <TableCell className="text-center">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>

                          <TableCell className="truncate">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{subscriber.email}</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant={
                                subscriber.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {subscriber.status === "active"
                                ? "Đang nhận tin"
                                : "Đã hủy"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            {new Date(subscriber.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubscriber(subscriber);
                                  setIsDetailOpen(true);
                                }}
                              >
                                <Eye size={16} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(subscriber)}
                              >
                                <RefreshCcw size={16} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() =>
                                  handleDeleteSubscriber(subscriber._id)
                                }
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

              <Pagination
                items={filteredSubscribers}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {selectedSubscriber && (
        <SubscriberDetail
          subscriber={selectedSubscriber}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedSubscriber(undefined);
          }}
        />
      )}
    </div>
  );
}
