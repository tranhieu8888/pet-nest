"use client";

import * as React from "react";
import {
  Search,
  ShoppingCart,
  Bell,
  User,
  Heart,
  ChevronDown,
  Package,
  LogOut,
  MessageCircle,
  Trash2,
  Menu,
  Scissors,
  Dog,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { api } from "../../../utils/axios";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { io, Socket } from "socket.io-client";
import pagesConfigEn from "../../../utils/petPagesConfig.en.js";
import pagesConfigVi from "../../../utils/petPagesConfig.vi.js";
import { jwtDecode } from "jwt-decode";

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface CartItem {
  _id: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

type SpaServiceMenuItem = {
  _id: string;
  name: string;
  slug: string;
  category: "spa" | "cleaning" | "grooming" | "coloring";
  image?: string;
  isActive: boolean;
};

interface Notification {
  _id: string;
  orderId?: string;
  ticketId?: string;
  title: string;
  description: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface CategoryMenu {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  children?: CategoryMenu[];
}

interface ParentCategoryMenu {
  parent: CategoryMenu;
  children: CategoryMenu[];
}

interface SearchProductItem {
  _id: string;
  type: "product";
  name: string;
  brand?: string;
  description?: string;
  categories?: string[];
  url: string;
}

interface SearchSpaItem {
  _id: string;
  type: "spaService";
  name: string;
  slug: string;
  category: string;
  description?: string;
  url: string;
}

interface SearchSuggestionResponse {
  products: SearchProductItem[];
  spaServices: SearchSpaItem[];
}

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:5000", {});
  }
  return socket;
}

function CartDropdown() {
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const { lang } = useLanguage();
  const config = lang === "vi" ? pagesConfigVi.header : pagesConfigEn.header;

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          setIsLoading(false);
          return;
        }
        const res = await api.get("/cart/getcart", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success && res.data.data) {
          const items = res.data.data.cartItems || [];
          setCartItems(items);
          setCartCount(items.length);
        }
      } catch (err) {
        console.error("Failed to fetch cart in header", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCart();

    // Lắng nghe sự kiện khi cart được update từ các component khác
    const handleCartUpdate = () => {
      fetchCart();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 p-0 text-[10px] font-bold text-white ring-2 ring-white">
              {cartCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-pink-600"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <>
              <div className="py-4 text-center text-muted-foreground">
                {config.cart.empty}
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                <Button className="w-full bg-pink-600 font-bold text-white hover:bg-pink-700" size="sm" asChild>
                  <Link href="/cart">{config.cart.viewCart}</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {cartItems.slice().reverse().map((item) => (
                  <div
                    key={`${item._id}`}
                    className="flex items-center space-x-3"
                  >
                    <img
                      src={(item as any).product?.selectedVariant?.images?.[0]?.url || (item as any).product?.images?.[0]?.url || "/placeholder.svg"}
                      alt={(item as any).product?.name || "Sản phẩm"}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {(item as any).product?.name || "Sản phẩm"}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-pink-600">
                          {((item as any).product?.selectedVariant?.price || 0).toLocaleString("vi-VN")}₫
                        </span>
                        <span className="text-sm text-gray-500">
                          x{(item as any).quantity || 1}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                <Button className="w-full bg-pink-600 font-bold text-white hover:bg-pink-700" size="sm" asChild>
                  <Link href="/cart">{config.cart.viewCart}</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("token");
        const res = await api.get("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data || []);
      } catch {
        setError("Không thể tải thông báo.");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const token = sessionStorage.getItem("token");
    let userId = null;

    if (token) {
      const decoded = jwtDecode<{ id: string }>(token);
      userId = decoded.id;
    }

    if (userId) {
      socket.emit("join", userId);
    }

    socket.on("notification", (notification: Notification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === notification._id);
        if (exists) return prev;
        return [notification, ...prev];
      });
    });

    return () => {
      socket.off("notification");
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        const token = sessionStorage.getItem("token");
        await api.patch(
          `/notifications/${notification._id}`,
          { isRead: true },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      } catch {}
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const token = sessionStorage.getItem("token");
      await api.delete(`/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err: any) {
      console.log("DELETE STATUS:", err?.response?.status);
      console.log("DELETE DATA:", err?.response?.data);
      console.log("DELETE MESSAGE:", err?.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const token = sessionStorage.getItem("token");
      await api.delete("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
    } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 p-0 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <h3 className="mb-3 font-semibold">Thông báo</h3>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {loading ? (
              <div>Đang tải...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div>Không có thông báo nào</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-3 ${
                    !notification.isRead
                      ? "border-pink-200 bg-pink-50"
                      : "bg-gray-50"
                  }`}
                >
                  <div
                    className="flex-1"
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <h4 className="text-sm font-medium">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                      )}
                    </div>
                    <p className="mb-1 text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                    disabled={deletingId === notification._id}
                    title="Xóa thông báo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          <Separator className="my-3" />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleDeleteAll}
          >
            Xóa tất cả thông báo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserDropdown({
  isLoggedIn,
  user,
  userRole,
}: {
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  userRole: number | null;
}) {
  const { lang } = useLanguage();
  const config = lang === "vi" ? pagesConfigVi.header : pagesConfigEn.header;

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("token");
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch (error) {
          console.error("Error disabling Google auto select:", error);
        }
      }
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.reload();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild 
          className="h-10 px-5 rounded-2xl font-bold text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-all active:scale-95 border-none"
        >
          <Link href="/login">{config.user.login}</Link>
        </Button>
        <Button 
          size="sm" 
          asChild 
          className="h-10 px-6 bg-pink-600 font-bold text-white hover:bg-pink-700 shadow-lg shadow-pink-200 rounded-2xl transition-all active:scale-95 border-none"
        >
          <Link href="/register">{config.user.signup}</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 transition-colors hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white shadow-md shadow-pink-100">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden font-semibold text-slate-700 md:block">{user?.name}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/userProfile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            {config.user.myProfile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/myorder" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            {config.user.myOrders}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-spa-bookings" className="flex items-center">
            <Scissors className="mr-2 h-4 w-4" />
            Lịch spa của tôi
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/petProfile" className="flex items-center">
            <Dog className="mr-2 h-4 w-4" />
            Thú cưng của tôi
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wishlist" className="flex items-center">
            <Heart className="mr-2 h-4 w-4" />
            {config.user.wishlist}
          </Link>
        </DropdownMenuItem>
        {userRole === 1 && (
          <DropdownMenuItem asChild>
            <Link href="/requestsupport" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              {config.user.requestSupport}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 hover:bg-red-50 focus:text-red-600" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {config.user.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SpaServicesDropdown({
  spaServices = [],
  loading = false,
  error = null,
}: {
  spaServices?: SpaServiceMenuItem[];
  loading?: boolean;
  error?: string | null;
}) {
  const { lang } = useLanguage();
  const config = lang === "vi" ? pagesConfigVi.header : pagesConfigEn.header;

  const getCategoryLabel = (category: SpaServiceMenuItem["category"]) => {
    return config.spa.categories[category] || category;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="group flex h-9 items-center gap-2 rounded-xl px-3 font-bold text-slate-700 transition-all hover:bg-white hover:text-pink-600 hover:shadow-sm active:scale-95"
        >
          <Scissors className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span className="hidden lg:inline">{config.spa.trigger}</span>
          <ChevronDown className="h-3 w-3 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[380px] overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 shadow-2xl"
      >
        <div className="border-b border-gray-50 bg-gray-50/50 px-4 py-4">
          <div className="text-sm font-bold text-gray-900">{config.spa.title}</div>
          {!loading && !error && spaServices.length > 0 && (
            <div className="mt-1 text-xs font-medium text-gray-500">
              {config.spa.activeCount.replace(
                "{count}",
                spaServices.length.toString()
              )}
            </div>
          )}
        </div>

        <div className="max-h-[460px] overflow-y-auto p-2 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-400">
              <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
              {config.spa.loading}
            </div>
          ) : error ? (
            <div className="m-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {config.spa.error}
            </div>
          ) : spaServices.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              {config.spa.noServices}
            </div>
          ) : (
            <div className="grid gap-1">
              {spaServices.map((service) => (
                <DropdownMenuItem
                  key={service._id}
                  asChild
                  className="cursor-pointer rounded-xl p-0 outline-none transition-all focus:bg-primary/5"
                >
                  <Link
                    href={`/spa-services/${service.slug}`}
                    className="group flex w-full items-center gap-4 p-3 transition-colors hover:bg-pink-50/50"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                      <img
                        src={service.image || "/placeholder.svg"}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-gray-800">
                        {service.name}
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                        {config.spa.suitableFor.replace(
                          "{category}",
                          getCategoryLabel(service.category)
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-pink-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-600">
                      {getCategoryLabel(service.category)}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header({
  initialSearchTerm = "",
}: {
  initialSearchTerm?: string;
}) {
  const [searchQuery, setSearchQuery] = React.useState(initialSearchTerm);
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );
  const [userRole, setUserRole] = useState<number | null>(null);

  const [categories, setCategories] = useState<ParentCategoryMenu[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  const [spaServices, setSpaServices] = useState<SpaServiceMenuItem[]>([]);
  const [loadingSpaServices, setLoadingSpaServices] = useState(true);
  const [errorSpaServices, setErrorSpaServices] = useState<string | null>(null);

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  const [searchResults, setSearchResults] = useState<SearchSuggestionResponse>({
    products: [],
    spaServices: [],
  });
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const getUserId = () => {
      const token = sessionStorage.getItem("token");
      let id = sessionStorage.getItem("userId");

      if ((!id || id === "") && token) {
        try {
          const decoded = jwtDecode<{ id?: string; _id?: string }>(token);
          id = decoded.id || decoded._id || "";
          if (id) sessionStorage.setItem("userId", id);
        } catch {}
      }

      return id && id !== "" ? id : null;
    };

    const trySetUserId = () => {
      const id = getUserId();
      if (id) {
        setUserId(id);
        if (retryTimeout.current) clearTimeout(retryTimeout.current);
      } else {
        retryTimeout.current = setTimeout(trySetUserId, 200);
      }
    };

    trySetUserId();

    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          setIsLoggedIn(false);
          setUser(null);
          return;
        }

        const response = await api.get("/auth/myprofile", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.data.success) {
          setUser(response.data.user);
          setIsLoggedIn(true);
        } else {
          sessionStorage.removeItem("token");
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          ((error as { response?: { status?: number } }).response?.status === 401 ||
            (error as { response?: { status?: number } }).response?.status === 403)
        ) {
          sessionStorage.removeItem("token");
        }
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  React.useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<{ role?: number }>(token);
        setUserRole(decoded.role ?? null);
      } catch {
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setLoadingCategories(true);
    api
      .get("/categories/childCategories")
      .then((res) => {
        setCategories(res.data);
        setLoadingCategories(false);
      })
      .catch((err) => {
        setErrorCategories(err.message || "Lỗi lấy danh mục");
        setLoadingCategories(false);
      });
  }, []);

  useEffect(() => {
    const fetchSpaServices = async () => {
      try {
        setLoadingSpaServices(true);
        setErrorSpaServices(null);

        const res = await api.get("/spa-services");
        const list = res?.data?.data;

        setSpaServices(Array.isArray(list) ? list : []);
      } catch (err: any) {
        setSpaServices([]);
        setErrorSpaServices(err?.message || "Lỗi lấy dịch vụ spa");
      } finally {
        setLoadingSpaServices(false);
      }
    };

    fetchSpaServices();
  }, []);

  React.useEffect(() => {
    setSearchQuery(initialSearchTerm);
  }, [initialSearchTerm]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      router.push(`/products/search/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const keyword = searchQuery.trim();

    if (!keyword) {
      setSearchResults({ products: [], spaServices: [] });
      setSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get(
          `/search/suggestions?q=${encodeURIComponent(keyword)}`
        );
        const data = res?.data?.data || { products: [], spaServices: [] };
        setSearchResults({
          products: Array.isArray(data.products) ? data.products : [],
          spaServices: Array.isArray(data.spaServices) ? data.spaServices : [],
        });
        setShowSearchDropdown(true);
      } catch (error) {
        setSearchResults({ products: [], spaServices: [] });
        setShowSearchDropdown(true);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || userRole !== 1) return;

    const socket = getSocket();
    const token = sessionStorage.getItem("token");
    let userId = null;

    if (token) {
      const decoded = jwtDecode<{ id: string }>(token);
      userId = decoded.id;
    }

    if (userId) {
      socket.emit("join", userId);
    }

    socket.on("newMessage", () => {
      if (pathname !== "/messages") {
        setUnreadChatCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [isLoggedIn, userRole, pathname]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!userId || !token) return;

        const res = await api.get(`/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const conversations = Array.isArray(res.data?.data) ? res.data.data : [];
        const totalUnread = conversations.reduce(
          (sum: number, conv: { unreadCount?: number }) => sum + (conv.unreadCount || 0),
          0
        );

        setUnreadChatCount(totalUnread);
      } catch {
        setUnreadChatCount(0);
      }
    };

    if (userId) fetchUnreadCount();
  }, [userId, pathname]);

  const hasSearchResults =
    searchResults.products.length > 0 || searchResults.spaServices.length > 0;

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/homepage">
            <div className="flex items-center space-x-2 transition-transform hover:scale-[1.02]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-600 shadow-lg shadow-pink-300/50">
                <span className="text-xl font-black text-white">
                  {lang === "vi"
                    ? pagesConfigVi.header.brand.short
                    : pagesConfigEn.header.brand.short}
                </span>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 md:block">
                {lang === "vi"
                  ? pagesConfigVi.header.brand.full.split(" ")[0]
                  : pagesConfigEn.header.brand.full.split(" ")[0]}
                <span className="text-pink-600">
                  {lang === "vi"
                    ? pagesConfigVi.header.brand.full.split(" ").slice(1).join(" ")
                    : pagesConfigEn.header.brand.full.split(" ").slice(1).join(" ")}
                </span>
              </span>
            </div>
          </Link>

          <div className="mx-6 hidden items-center md:flex">
            <nav className="flex items-center gap-1 rounded-2xl bg-slate-100/50 p-1 border border-slate-200/50 backdrop-blur-sm">
              <div className="group/category relative">
                <div className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 font-bold text-slate-700 transition-all hover:bg-white hover:text-pink-600 hover:shadow-sm active:scale-95">
                  <Menu className="h-4 w-4" />
                  <span className="text-sm">{lang === "vi" ? "Danh mục" : "Categories"}</span>
                </div>

                <div className="invisible absolute left-0 top-full w-[300px] pt-3 opacity-0 transition-all duration-200 group-hover/category:visible group-hover/category:opacity-100 z-50">
                  <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-200/50">
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {loadingCategories
                        ? "Đang tải..."
                        : lang === "vi"
                        ? "Tất cả danh mục"
                        : "All Categories"}
                    </div>

                    {errorCategories && (
                      <div className="px-2 text-sm text-red-500">
                        {errorCategories}
                      </div>
                    )}

                    <div className="relative mt-1 flex flex-col gap-0.5 pb-1">
                      {!loadingCategories &&
                        !errorCategories &&
                        categories.map((cat) => (
                          <div
                            key={cat.parent._id}
                            className="group/item relative"
                          >
                            <Link
                              href={`/category/${cat.parent._id}`}
                              className="flex w-full items-center rounded-xl p-2.5 transition-all hover:bg-pink-50 hover:text-pink-600"
                            >
                              {cat.parent.image && (
                                <div className="relative mr-3 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-100 shadow-sm transition-colors group-hover/item:border-pink-200">
                                  <img
                                    src={cat.parent.image}
                                    alt={cat.parent.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <span className="flex-1 text-sm font-bold">
                                {cat.parent.name}
                              </span>
                              {cat.children && cat.children.length > 0 && (
                                <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-slate-300 transition-colors group-hover/item:text-pink-600" />
                              )}
                            </Link>

                            {cat.children && cat.children.length > 0 && (
                              <div className="invisible absolute left-full top-0 z-50 ml-2 w-[260px] pt-0 opacity-0 transition-all duration-200 group-hover/item:visible group-hover/item:opacity-100">
                                <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-200/50">
                                  <div className="mb-1 border-b border-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-pink-600">
                                    {cat.parent.name}
                                  </div>
                                  <ul className="grid gap-0.5 pb-1">
                                    {cat.children.map((child) => (
                                      <li
                                        key={child._id}
                                        className="group/subitem relative"
                                      >
                                        <Link
                                          href={`/category/${child._id}`}
                                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-slate-600 transition-all hover:bg-pink-50 hover:text-pink-600"
                                        >
                                          <div className="flex items-center gap-2">
                                            {child.image && (
                                              <img
                                                src={child.image}
                                                alt={child.name}
                                                className="h-6 w-6 rounded-lg border border-slate-100 object-cover"
                                              />
                                            )}
                                            <span className="text-sm font-bold">
                                              {child.name}
                                            </span>
                                          </div>
                                          {child.children &&
                                            child.children.length > 0 && (
                                              <ChevronDown className="h-3.5 w-3.5 shrink-0 -rotate-90 text-slate-300 transition-colors group-hover/subitem:text-pink-600" />
                                            )}
                                        </Link>

                                        {child.children &&
                                          child.children.length > 0 && (
                                            <div className="invisible absolute left-full top-0 z-60 ml-2 w-[240px] pt-0 opacity-0 transition-all duration-200 group-hover/subitem:visible group-hover/subitem:opacity-100">
                                              <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-200/50">
                                                <div className="mb-1 border-b border-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-pink-600">
                                                  {child.name}
                                                </div>
                                                <ul className="grid gap-0.5 pb-1">
                                                  {child.children.map((grand) => (
                                                    <li key={grand._id}>
                                                      <Link
                                                        href={`/category/${grand._id}`}
                                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-all hover:bg-pink-50 hover:text-pink-600"
                                                      >
                                                        {grand.image && (
                                                          <img
                                                            src={grand.image}
                                                            alt={grand.name}
                                                            className="h-5 w-5 rounded-md border border-slate-100 object-cover"
                                                          />
                                                        )}
                                                        <span className="font-bold">{grand.name}</span>
                                                      </Link>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            </div>
                                          )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <SpaServicesDropdown
                spaServices={spaServices}
                loading={loadingSpaServices}
                error={errorSpaServices}
              />

              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="flex h-9 items-center gap-2 rounded-xl px-4 font-bold text-slate-700 transition-all hover:bg-white hover:text-pink-600 hover:shadow-sm active:scale-95"
              >
                <Link href="/blog" aria-label="Blog">
                  Blog
                </Link>
              </Button>
            </nav>
          </div>

          <div className="mr-8 hidden flex-1 items-center md:flex">
            <div className="relative flex-1" ref={searchBoxRef}>
              <form className="relative" onSubmit={handleSearch}>
                <Input
                  type="text"
                  placeholder={
                    lang === "vi"
                      ? pagesConfigVi.header.search.placeholder
                      : pagesConfigEn.header.search.placeholder
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSearchDropdown(true);
                  }}
                  className="w-full h-11 rounded-2xl border-slate-100 bg-slate-100/30 pl-5 pr-14 transition-all focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-500/5 outline-none font-medium text-slate-700 placeholder:text-slate-400"
                />
                <Button
                  size="icon"
                  className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-xl bg-pink-600 text-white hover:bg-pink-700 shadow-md shadow-pink-200 transition-all hover:scale-110 active:scale-95"
                  type="submit"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {showSearchDropdown && (
                <div className="absolute left-0 right-0 top-full z-100 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  {searching ? (
                    <div className="p-4 text-sm text-gray-500">
                      Đang tìm kiếm...
                    </div>
                  ) : !hasSearchResults ? (
                    <div className="p-4 text-sm text-gray-500">
                      Không tìm thấy kết quả phù hợp
                    </div>
                  ) : (
                    <div className="p-2">
                      {searchResults.products.length > 0 && (
                        <div className="mb-2">
                          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Sản phẩm
                          </div>
                          <div className="space-y-1">
                            {searchResults.products.map((item) => (
                              <Link
                                key={item._id}
                                href={item.url}
                                onClick={() => setShowSearchDropdown(false)}
                                className="block rounded-xl px-3 py-3 transition-colors hover:bg-pink-50"
                              >
                                <div className="text-sm font-semibold text-gray-800">
                                  {item.name}
                                </div>
                                {item.brand && (
                                  <div className="text-xs text-gray-500">
                                    Thương hiệu: {item.brand}
                                  </div>
                                )}
                                {item.categories &&
                                  item.categories.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      Danh mục: {item.categories.join(", ")}
                                    </div>
                                  )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.spaServices.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Dịch vụ spa
                          </div>
                          <div className="space-y-1">
                            {searchResults.spaServices.map((item) => (
                              <Link
                                key={item._id}
                                href={item.url}
                                onClick={() => setShowSearchDropdown(false)}
                                className="block rounded-xl px-3 py-3 transition-colors hover:bg-pink-50"
                              >
                                <div className="text-sm font-semibold text-gray-800">
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Loại dịch vụ: {item.category}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2 border-t px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleSearch()}
                          className="text-sm font-medium text-pink-600 hover:underline"
                        >
                          Xem tất cả kết quả cho "{searchQuery}"
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100/50 text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-all border border-slate-200/50"
              asChild
            >
              <Link href="/wishlist" aria-label="Yêu thích">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>



            {isLoggedIn && userRole === 1 && (
              <Button
                onClick={() => router.push("/messages")}
                variant="ghost"
                size="sm"
                className="relative flex h-10 w-10 items-center justify-center rounded-full p-0 transition-all duration-200"
                title="Chat với CSKH"
              >
                <MessageCircle className="mx-auto h-5 w-5" />
                {unreadChatCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 p-0 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadChatCount}
                  </Badge>
                )}
              </Button>
            )}

            {isLoggedIn && (
              <>
                <NotificationDropdown />
                <CartDropdown />
              </>
            )}

            <UserDropdown
              isLoggedIn={isLoggedIn}
              user={user}
              userRole={userRole}
            />
          </div>
        </div>
      </div>

      <div className="border-t p-4 md:hidden">
        <form className="relative" onSubmit={handleSearch}>
          <Input
            type="text"
            placeholder={
              lang === "vi"
                ? pagesConfigVi.header.search.mobilePlaceholder
                : pagesConfigEn.header.search.mobilePlaceholder
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-2xl border-slate-100 bg-slate-100/30 pl-4 pr-12 transition-all focus:bg-white focus:border-pink-200 outline-none"
          />
          <Button
            size="icon"
            className="absolute right-1 top-1.5 h-7 w-7 rounded-xl bg-pink-600 text-white hover:bg-pink-700 shadow-sm"
            type="submit"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
