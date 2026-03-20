import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { api, useApi } from "../../../../../utils/axios";
import { Subscriber } from "../types";

export interface NotificationItem {
  _id: string;
  title: string;
  description?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const useSubscribers = (itemsPerPage: number = 5) => {
  const { request } = useApi();
  const socketRef = useRef<Socket | null>(null);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | undefined>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/subscribers");
      
      const data = response?.data;
      if (Array.isArray(data)) {
        setSubscribers(data);
      } else if (data?.success && Array.isArray(data.data)) {
        setSubscribers(data.data);
      } else {
        setSubscribers([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách email đăng ký");
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket Connection
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const adminId = decoded.id || decoded._id;
      if (!adminId) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const SOCKET_URL = new URL(API_URL).origin;

      const socket = io(SOCKET_URL, {
        path: "/socket.io",
        transports: ["websocket"],
        reconnection: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join", adminId);
      });

      socket.on("notification", (newNotification: NotificationItem) => {
        if (newNotification.type === "subscriber") {
          fetchSubscribers();
        }
      });

      return () => {
        socket.off("connect");
        socket.off("notification");
        socket.disconnect();
      };
    } catch (error) {
      console.error("Lỗi socket subscribers:", error);
    }
  }, [fetchSubscribers]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const toggleStatus = async (subscriber: Subscriber) => {
    try {
      const endpoint =
        subscriber.status === "active"
          ? `/subscribers/${subscriber._id}/unsubscribe`
          : `/subscribers/${subscriber._id}/activate`;

      const response = await api.patch(endpoint);

      if (response.data?.success || response.status === 200) {
        await fetchSubscribers();
        toast.success(
          subscriber.status === "active"
            ? "Đã hủy đăng ký email"
            : "Đã kích hoạt lại email"
        );
      } else {
        toast.error("Cập nhật trạng thái thất bại");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Cập nhật trạng thái thất bại");
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xoá email đăng ký này?")) return;

    try {
      const response = await api.delete(`/subscribers/${id}`);
      if (response.data?.success || response.status === 200) {
        await fetchSubscribers();
        toast.success("Xóa email đăng ký thành công");
      } else {
        toast.error("Xóa email đăng ký thất bại");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Xóa email đăng ký thất bại");
    }
  };

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(
      (subscriber) =>
        subscriber.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscriber.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subscribers, searchQuery]);

  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubscribers.slice(start, start + itemsPerPage);
  }, [filteredSubscribers, currentPage, itemsPerPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleOpenDetail = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedSubscriber(undefined);
  };

  return {
    subscribers: filteredSubscribers,
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
    refresh: fetchSubscribers,
  };
};
