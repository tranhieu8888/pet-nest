"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { api, useApi } from "../../../../utils/axios";
import { useRouter } from "next/navigation";

type NotificationItem = {
  _id: string;
  title: string;
  description?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function AdminNotificationBell({
  adminId,
}: {
  adminId: string | null;
}) {
  const { request } = useApi();
  const router = useRouter();

  const socketRef = useRef<Socket | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 360 });

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      const response = await request(() => api.get("/notifications"));

      if (response?.success) {
        setNotifications(response.data || []);
      } else if (Array.isArray(response)) {
        setNotifications(response);
      } else if (Array.isArray(response?.data)) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Lỗi lấy notifications:", error);
    }
  };

  const markOne = async (id: string, isRead: boolean) => {
    try {
      await request(() => api.patch(`/notifications/${id}`, { isRead }));
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead } : item))
      );
      toast.success(isRead ? "Đã đọc" : "Chưa đọc");
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật thông báo");
    }
  };

  const markAll = async (isRead: boolean) => {
    try {
      await request(() => api.patch(`/notifications/mark-all`, { isRead }));
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead })));
      toast.success(
        isRead
          ? "Tất cả đã đọc"
          : "Tất cả chưa đọc"
      );
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật tất cả thông báo");
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await request(() => api.delete(`/notifications/${id}`));
      setNotifications((prev) => prev.filter((item) => item._id !== id));
      toast.success("Đã xóa thông báo");
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa thông báo");
    }
  };

  const deleteAll = async () => {
    try {
      await request(() => api.delete(`/notifications`));
      setNotifications([]);
      toast.success("Đã xóa tất cả thông báo");
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa tất cả thông báo");
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markOne(item._id, true);
    }

    if (item.type === "subscriber") {
      setOpen(false);
      router.push("/admin/subscribers");
      return;
    }

    // có thể mở rộng thêm:
    // if (item.type === "order") router.push("/admin/orders");
    // if (item.type === "ticket") router.push("/admin/tickets");
  };

  const updatePanelPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.min(380, window.innerWidth - 16);
    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8)
    );
    const top = rect.bottom + 8;

    setPanelPos({ top, left, width });
  };

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
  }, []);

  useEffect(() => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const SOCKET_URL = new URL(API_URL).origin;

    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (adminId) {
        socket.emit("join", adminId);
      }
    });

    socket.on("notification", (newNotification: NotificationItem) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item._id === newNotification._id);
        if (exists) return prev;
        return [newNotification, ...prev];
      });

      toast.success(newNotification.title || "Có thông báo mới");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err);
    });

    return () => {
      socket.off("connect");
      socket.off("notification");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [adminId]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();

    const handleReposition = () => updatePanelPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed rounded-xl border bg-white shadow-2xl overflow-hidden z-[99999]"
            style={{
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
              maxHeight: "460px",
            }}
          >
            <div className="px-4 py-3 border-b bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Thông báo
                  </h3>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0
                      ? `${unreadCount} thông báo chưa đọc`
                      : "Không có thông báo chưa đọc"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => markAll(true)}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Đọc hết
                  </button>

                  <button
                    type="button"
                    onClick={() => markAll(false)}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Chưa đọc
                  </button>

                  <button
                    type="button"
                    onClick={deleteAll}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa hết
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto bg-white">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item._id}
                    className={`w-full border-b last:border-b-0 ${
                      !item.isRead ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3">
                        {!item.isRead && (
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {item.title}
                          </p>

                          {item.description && (
                            <p className="mt-1 text-sm text-gray-600 break-words">
                              {item.description}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </button>

                    <div className="px-4 pb-3 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markOne(item._id, !item.isRead);
                        }}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        {item.isRead ? "Chưa đọc" : "Đã đọc"}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOne(item._id);
                        }}
                        className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          onClick={() => {
            if (!open) updatePanelPosition();
            setOpen((prev) => !prev);
          }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow hover:bg-white transition"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {panel}
    </>
  );
}
