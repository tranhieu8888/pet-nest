"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  LogOut,
  User,
  Users,
  ChevronUp,
  ChevronDown,
  Megaphone,
  Gift,
  ListTree,
  SlidersHorizontal,
  TicketPercent,
  Mail,
  Workflow,
  ImageIcon,
  ShoppingCart,
  Server,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import AdminNotificationBell from "./components/AdminNotificationBell";

type MenuChild = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type MenuItemType = {
  title: string;
  url?: string;
  icon: LucideIcon;
  children?: MenuChild[];
};

const menuItems: MenuItemType[] = [
  {
    title: "Nguyện: Admin Dashboard",
    url: "/admin/dashboard",
    icon: TrendingUp,
  },
  {
    title: "Quản lý người dùng",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Quản lý bài viết",
    url: "/admin/blog",
    icon: Megaphone,
  },
  {
    title: "Sản phẩm",
    icon: Gift,
    children: [
      {
        title: "Quản lý sản phẩm",
        url: "/admin/product",
        icon: Gift,
      },
      {
        title: "Quản lý danh mục",
        url: "/admin/category",
        icon: ListTree,
      },
      {
        title: "Quản lý thuộc tính",
        url: "/admin/attribute",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    title: "Quản lý lịch làm việc",
    url: "/admin/staff-schedule",
    icon: Workflow,
  },
  {
    title: "Quản lý email đăng ký",
    url: "/admin/subscribers",
    icon: Mail,
  },
  {
    title: "Quản lý quảng cáo",
    url: "/admin/banner",
    icon: ImageIcon,
  },
  {
    title: "Quản lý mã giảm giá",
    url: "/admin/voucher",
    icon: TicketPercent,
  },
  {
    title: "Quản lý dịch vụ spa",
    url: "/admin/spa-services",
    icon: Server,
  },
  {
    title: "Quản lý đặt lịch spa",
    url: "/admin/spa-bookings",
    icon: ImageIcon,
  },
  {
    title: "Minh: Quản lý orders",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Quản lý đánh giá",
    url: "/admin/review",
    icon: MessageCircle,
  },
];

function AdminSidebar({ adminId }: { adminId: string | null }) {
  const pathname = usePathname();

  const isPathActive = (url?: string) => {
    if (!url) return false;
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const isProductGroupActive =
    isPathActive("/admin/product") ||
    isPathActive("/admin/category") ||
    isPathActive("/admin/attribute");

  const [productMenuOpen, setProductMenuOpen] = useState(isProductGroupActive);

  useEffect(() => {
    if (isProductGroupActive) {
      setProductMenuOpen(true);
    }
  }, [isProductGroupActive]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <Sidebar className="border-r bg-white shadow-xl overflow-visible">
      <SidebarHeader className="border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white overflow-visible">
        <div className="flex items-center justify-between px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/admin/dashboard">
                  <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                    <TrendingUp className="size-5" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-bold text-lg">Admin Panel</span>
                    <span className="text-xs opacity-80">
                      Management System
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="shrink-0">
            <AdminNotificationBell adminId={adminId} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wider px-3">
            Quản lý hệ thống
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                if (item.children) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <button
                        type="button"
                        onClick={() => setProductMenuOpen((prev) => !prev)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isProductGroupActive
                            ? "bg-indigo-100 text-indigo-600 font-semibold"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </div>

                        <ChevronDown
                          className={`size-4 transition-transform duration-200 ${
                            productMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {productMenuOpen && (
                        <div className="mt-1 ml-6 pl-3 border-l border-gray-200 space-y-1">
                          {item.children.map((child) => {
                            const isChildActive = isPathActive(child.url);

                            return (
                              <SidebarMenuButton
                                key={child.title}
                                asChild
                                className={`transition-all duration-200 rounded-lg ${
                                  isChildActive
                                    ? "bg-indigo-100 text-indigo-600 font-semibold"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <Link
                                  href={child.url}
                                  className="flex items-center gap-3 px-3 py-2"
                                >
                                  <child.icon className="size-4" />
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            );
                          })}
                        </div>
                      )}
                    </SidebarMenuItem>
                  );
                }

                const isActive = isPathActive(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`transition-all duration-200 rounded-lg ${
                        isActive
                          ? "bg-indigo-100 text-indigo-600 font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Link
                        href={item.url!}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-gray-100 transition">
              <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500 text-white">
                <User className="size-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-medium">Trang admin</span>
                <span className="text-xs text-gray-500">admin@gmail.com</span>
              </div>
              <ChevronUp className="ml-auto size-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 rounded-xl shadow-lg">
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));

      if (decoded.role !== 0) {
        router.push("/");
        return;
      }

      setAdminId(decoded.id || decoded._id || null);
    } catch {
      router.push("/login");
    }
  }, [router]);

  return (
    <SidebarProvider>
      <AdminSidebar adminId={adminId} />

      <SidebarInset className="bg-gray-50 min-h-screen">
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
