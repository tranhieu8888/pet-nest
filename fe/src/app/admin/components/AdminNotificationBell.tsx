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

  return (
    <>
      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          onClick={() => {
            if (!open) updatePanelPosition();
            setOpen((prev) => !prev);
          }}
          className={`relative flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            open ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none border-2 border-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {open && mounted && createPortal(
        <div
          ref={panelRef}
          className="fixed rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-[99999] animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width,
            maxHeight: "480px",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[15px] font-bold text-slate-900">
                Thông báo
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => markAll(true)}
                  title="Đánh dấu tất cả đã đọc"
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={deleteAll}
                  title="Xóa tất cả"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                unreadCount > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
              }`}>
                {unreadCount} CHƯA ĐỌC
              </span>
              <button
                type="button"
                onClick={() => markAll(false)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Hoàn tác tất cả
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[380px] overflow-y-auto bg-white custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-3">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-[13px] font-medium text-slate-900">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-400 mt-1">Chúng tôi sẽ thông báo cho bạn khi có tin mới.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((item) => (
                  <div
                    key={item._id}
                    className={`relative group transition-colors ${
                      !item.isRead ? "bg-blue-50/40" : "bg-white hover:bg-slate-50/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className="w-full text-left px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        {!item.isRead && (
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-600 shrink-0 shadow-[0_0_0_2px_rgba(37,99,235,0.2)]" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13.5px] leading-snug ${!item.isRead ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="mt-1 text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <p className="mt-2 text-[11px] font-medium text-slate-400 uppercase tracking-tight">
                            {new Date(item.createdAt).toLocaleString("vi-VN", {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Hover Actions */}
                    <div className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-slate-100 shadow-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markOne(item._id, !item.isRead);
                        }}
                        title={item.isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                        className="p-1 px-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        {item.isRead ? "CHƯA ĐỌC" : "ĐÃ ĐỌC"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOne(item._id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-50 bg-slate-50/30">
              <button 
                className="w-full py-2 text-[12px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
                onClick={() => setOpen(false)}
              >
                Đóng
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
