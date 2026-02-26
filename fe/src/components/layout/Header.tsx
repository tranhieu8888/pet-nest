'use client';

import * as React from "react"
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
} from "lucide-react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { api } from "../../../utils/axios"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useLanguage } from '@/context/LanguageContext';
import { io, Socket } from "socket.io-client";
import axios from 'axios'
import pagesConfigEn from '../../../utils/petPagesConfig.en.js';
import pagesConfigVi from '../../../utils/petPagesConfig.vi.js';
import { jwtDecode } from 'jwt-decode';

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

// Thêm interface cho category
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

// Sample cart items


let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:5000", {
    });
  }
  return socket;
}


function CartDropdown() {
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const { lang } = useLanguage();
  const config = lang === 'vi' ? pagesConfigVi.header : pagesConfigEn.header;

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/cart/getcart');
        if (response.data.success && response.data.data) {
          const items = response.data.data.cartItems || [];
          setCartItems((items as any[]).map((item: any) => ({
            _id: item._id || '',
            variantId: item.product.selectedVariant?._id || '',
            name: item.product.name || 'Unknown Product',
            price: item.product.selectedVariant?.price || 0,
            quantity: item.quantity || 1,
            image: item.product.selectedVariant?.images?.[0]?.url || "/placeholder.svg"
          })));
          setCartCount(items.length);
        } else {
          setCartItems([]);
          setCartCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch cart data:", error);
        setCartItems([]);
        setCartCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartData();

    const handleCartUpdate = () => {
      fetchCartData();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Get the latest added product (last in the array)
  const latestItem = cartItems.length > 0 ? cartItems[cartItems.length - 1] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {cartCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <h3 className="font-semibold mb-3">{config.cart.title}</h3>
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : !latestItem ? (
            <div className="text-center py-4 text-muted-foreground">
              {config.cart.empty}
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <div key={`${latestItem._id}-${latestItem.variantId}`} className="flex items-center space-x-3">
                  <img
                    src={latestItem.image || "/placeholder.svg"}
                    alt={latestItem.name}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{latestItem.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-500 font-semibold">{latestItem.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                <Button className="w-full" size="sm" asChild>
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

  // Lấy notification
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("token");
        const res = await api.get('/notification', {
          headers: { Authorization: `Bearer ${token}` }
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

  // Lắng nghe socket để nhận notification mới
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
      setNotifications(prev => [notification, ...prev]);
    });
    return () => {
      socket.off("notification");
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Đánh dấu đã đọc
  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        const token = sessionStorage.getItem("token");
        await api.patch(`/notification/${notification._id}`, { isRead: true }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
      } catch {
        // Có thể hiện toast lỗi ở đây
      }
    }
    console.log('notification:', notification);
    if (notification.orderId) {
      // router.push(`/myorder/${notification.orderId}`); // Removed as per edit hint
    }
    if (notification.type === 'ticket' && notification.ticketId) {
      // router.push(`/requestsupport/${notification.ticketId}`); // Removed as per edit hint
    }
  };

  // Xóa notification theo id
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const token = sessionStorage.getItem("token");
      await api.delete(`/notification/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {
      // Có thể hiện toast lỗi ở đây
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Thông báo</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
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
                  className={`p-3 rounded-lg border ${!notification.isRead ? "bg-blue-50 border-blue-200" : "bg-gray-50"} cursor-pointer flex justify-between items-start gap-2`}
                >
                  <div className="flex-1" onClick={() => handleMarkAsRead(notification)}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{notification.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 text-red-500 hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                    disabled={deletingId === notification._id}
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          <Separator className="my-3" />
          <Button variant="outline" size="sm" className="w-full" onClick={() => { }}>
            Xóa tất cả thông báo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserDropdown({ isLoggedIn, user, userRole }: { isLoggedIn: boolean, user: { name: string, email: string } | null, userRole: number | null }) {
  const { lang } = useLanguage();
  const config = lang === 'vi' ? pagesConfigVi.header : pagesConfigEn.header;

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('token');
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch (error) {
          console.error('Error disabling Google auto select:', error);
        }
      }
      // Cập nhật trạng thái
      // Reload lại trang để cập nhật UI
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.reload();
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">{config.user.login}</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">{config.user.signup}</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden md:block">{user?.name}</span>
          <ChevronDown className="h-4 w-4" />
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
        <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {config.user.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Header({ initialSearchTerm = "" }: { initialSearchTerm?: string }) {
  const [searchQuery, setSearchQuery] = React.useState(initialSearchTerm)
  const { lang, setLang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [categories, setCategories] = useState<ParentCategoryMenu[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  // Lấy userId từ sessionStorage hoặc token khi mount, retry nếu chưa có
  useEffect(() => {
    const getUserId = () => {
      const token = sessionStorage.getItem("token");
      let id = sessionStorage.getItem("userId");
      if ((!id || id === "") && token) {
        try {
          const decoded = jwtDecode<{ id?: string; _id?: string }>(token);
          id = decoded.id || decoded._id || "";
          if (id) sessionStorage.setItem("userId", id);
        } catch { }
      }
      return id && id !== "" ? id : null;
    };

    const trySetUserId = () => {
      const id = getUserId();
      if (id) {
        setUserId(id);
        if (retryTimeout.current) clearTimeout(retryTimeout.current);
      } else {
        // Thử lại sau 200ms nếu chưa có userId
        retryTimeout.current = setTimeout(trySetUserId, 200);
      }
    };

    trySetUserId();

    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  // Move auth check here
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          setIsLoggedIn(false);
          setUser(null);
          return;
        }
        const axiosInstance = axios.create({
          baseURL: 'http://localhost:5000',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const response = await axiosInstance.get('/api/auth/myprofile');
        if (response.data.success) {
          setUser(response.data.user);
          setIsLoggedIn(true);
        } else {
          sessionStorage.removeItem('token');
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            sessionStorage.removeItem('token');
          }
        }
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  React.useEffect(() => {
    const token = sessionStorage.getItem('token');
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
  // Fetch categories for menu
  useEffect(() => {
    setLoadingCategories(true);
    api.get('/categories/childCategories')
      .then((res) => {
        setCategories(res.data);
        setLoadingCategories(false);
      })
      .catch((err) => {
        setErrorCategories(err.message || 'Lỗi lấy danh mục');
        setLoadingCategories(false);
      });
  }, []);

  // Nếu initialSearchTerm thay đổi (khi chuyển trang search), đồng bộ input
  React.useEffect(() => {
    setSearchQuery(initialSearchTerm);
  }, [initialSearchTerm]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products/search/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Lắng nghe socket để nhận tin nhắn mới
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
    // Lắng nghe tin nhắn mới
    socket.on("newMessage", () => {
      // Nếu user không ở trang /messages thì tăng số chưa đọc
      if (pathname !== "/messages") {
        setUnreadChatCount((prev) => {
          const newCount = prev + 1;
          return newCount;
        });
      }
    });
    return () => {
      socket.off("newMessage");
    };
  }, [isLoggedIn, userRole, pathname]);

  // Đọc số lượng tin nhắn chưa đọc từ API khi khởi tạo
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!userId || !token) return;
        const res = await axios.get(
          `http://localhost:5000/conversation/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Tổng số tin nhắn chưa đọc từ tất cả conversation
        const totalUnread = Array.isArray(res.data)
          ? res.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
          : 0;
        setUnreadChatCount(totalUnread);
      } catch (e) {
        setUnreadChatCount(0);
      }
    };
    if (userId) fetchUnreadCount();
  }, [userId, pathname]);

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href='/homepage'>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">{lang === 'vi' ? pagesConfigVi.header.brand.short : pagesConfigEn.header.brand.short}</span>
              </div>
              <span className="text-xl font-bold">{lang === 'vi' ? pagesConfigVi.header.brand.full : pagesConfigEn.header.brand.full}</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <form className="relative" onSubmit={handleSearch}>
              <Input
                type="text"
                placeholder={lang === 'vi' ? pagesConfigVi.header.search.placeholder : pagesConfigEn.header.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-12 py-2 w-full"
              />
              <Button size="sm" className="absolute right-1 top-1 h-8" type="submit">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile search */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
            {/* Blog */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/blog" aria-label="Blog">
                Blog
              </Link>
            </Button>
            {/* Wishlist */}
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <Link href="/wishlist" aria-label="Yêu thích">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>



            {/* Language Switcher */}
            <Button variant="outline" size="sm" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
              {lang === 'vi' ? pagesConfigVi.header.language.vi : pagesConfigEn.header.language.en}
            </Button>
            {/* Nút Chatbot, Notification, Cart chỉ hiển thị nếu đã đăng nhập */}
            {isLoggedIn && userRole === 1 && (
              <Button
                onClick={() => router.push('/messages')}
                variant="ghost"
                size="sm"
                className="rounded-full p-0 w-10 h-10 flex items-center justify-center transition-all duration-200 relative"
                title="Chat với CSKH"
              >
                <MessageCircle className="h-5 w-5 mx-auto" />
                {unreadChatCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
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
            {/* User Account */}
            <UserDropdown isLoggedIn={isLoggedIn} user={user} userRole={userRole} />
          </div>
        </div>
      </div>
      {/* Thanh menu category cha */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 flex items-center gap-2 min-h-[48px]">
          {loadingCategories ? (
            <div className="px-4 py-2 text-sm">Đang tải danh mục...</div>
          ) : errorCategories ? (
            <div className="px-4 py-2 text-sm text-red-500">{errorCategories}</div>
          ) : (
            categories.map((cat) => (
              <DropdownMenu key={cat.parent._id}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 font-semibold text-base hover:bg-primary/10 transition-colors rounded-xl px-4 py-2 shadow-sm border border-transparent hover:border-primary/30"
                  >
                    {cat.parent.image && (
                      <img src={cat.parent.image} alt={cat.parent.name} className="w-6 h-6 rounded-full object-cover mr-2" />
                    )}
                    <span className="text-primary font-bold">{cat.parent.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="rounded-2xl shadow-2xl p-2 min-w-[320px] animate-fade-in bg-white border border-gray-100 mt-2"
                  style={{ zIndex: 50 }}
                >
                  <ul>
                    {cat.children.map((child) => (
                      <li key={child._id} className="mb-1">
                        <div
                          className="font-medium cursor-pointer hover:underline flex items-center pl-2 py-2 rounded-lg hover:bg-primary/10 transition-colors group"
                          onClick={() => router.push(`/category/${child._id}`)}
                        >
                          {child.image && (
                            <img src={child.image} alt={child.name} className="w-5 h-5 rounded object-cover mr-2" />
                          )}
                          <span className="group-hover:text-primary font-semibold">{child.name}</span>
                          {child.children && child.children.length > 0 && (
                            <span className="ml-1 text-gray-400">&gt;</span>
                          )}
                        </div>
                        {child.children && child.children.length > 0 && (
                          <ul className="ml-7 mt-1">
                            {child.children.map((grand) => (
                              <li
                                key={grand._id}
                                className="mb-1 hover:underline cursor-pointer text-sm pl-2 py-1 rounded hover:bg-primary/5 transition-colors flex items-center"
                                onClick={() => router.push(`/category/${grand._id}`)}
                              >
                                {grand.image && (
                                  <img src={grand.image} alt={grand.name} className="w-4 h-4 rounded object-cover mr-2" />
                                )}
                                <span>{grand.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </DropdownMenuContent>
              </DropdownMenu>
            ))
          )}
        </div>
      </div>
      <div className="md:hidden border-t p-4">
        <form className="relative" onSubmit={handleSearch}>
          <Input
            type="text"
            placeholder={lang === 'vi' ? pagesConfigVi.header.search.mobilePlaceholder : pagesConfigEn.header.search.mobilePlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-12 py-2 w-full"
          />
          <Button size="sm" className="absolute right-1 top-1 h-8" type="submit">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}