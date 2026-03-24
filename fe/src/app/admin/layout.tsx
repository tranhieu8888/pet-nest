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
  MessageCircle,
  Calendar,
  LayoutDashboard,
  Star,
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

type MenuGroup = {
  label: string;
  items: {
    title: string;
    url?: string;
    icon: LucideIcon;
    children?: MenuChild[];
  }[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Hàng hóa",
    items: [
      {
        title: "Sản phẩm",
        icon: Gift,
        children: [
          { title: "Quản lý sản phẩm", url: "/admin/product", icon: Gift },
          { title: "Quản lý danh mục", url: "/admin/category", icon: ListTree },
          { title: "Quản lý thuộc tính", url: "/admin/attribute", icon: SlidersHorizontal },
        ],
      },
    ],
  },
  {
    label: "Dịch vụ Spa",
    items: [
      { title: "Dịch vụ Spa", url: "/admin/spa-services", icon: Server },
      { title: "Đặt lịch Spa", url: "/admin/spa-bookings", icon: Calendar },
      { title: "Lịch làm việc nhân viên", url: "/admin/staff-schedule", icon: Workflow },
    ],
  },
  {
    label: "Đơn hàng",
    items: [
      { title: "Quản lý đơn hàng", url: "/admin/orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Người dùng",
    items: [
      { title: "Quản lý người dùng", url: "/admin/users", icon: Users },
      { title: "Quản lý đánh giá", url: "/admin/review", icon: Star },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Quảng cáo / Banner", url: "/admin/banner", icon: ImageIcon },
      { title: "Mã giảm giá", url: "/admin/voucher", icon: TicketPercent },
      { title: "Bài viết / Blog", url: "/admin/blog", icon: Megaphone },
      { title: "Email đăng ký", url: "/admin/subscribers", icon: Mail },
    ],
  },
];

function AdminSidebar({ adminId }: { adminId: string | null }) {
  const pathname = usePathname();
  const [optimisticPathname, setOptimisticPathname] = useState<string | null>(null);

  // Clear optimistic path when actual pathname changes
  useEffect(() => {
    setOptimisticPathname(null);
  }, [pathname]);

  const currentPath = optimisticPathname || pathname;

  const isPathActive = (url?: string) => {
    if (!url) return false;
    return currentPath === url || currentPath.startsWith(`${url}/`);
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

  const renderItem = (item: MenuGroup["items"][0]) => {
    if (item.children) {
      const isGroupActive = item.children.some((c) => isPathActive(c.url));
      return (
        <SidebarMenuItem key={item.title}>
          <button
            type="button"
            onClick={() => setProductMenuOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between gap-3 px-5 py-3 transition-colors text-[13.5px] group ${
              isGroupActive
                ? "text-blue-600 font-semibold bg-blue-50/30"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <item.icon className={`size-[18px] transition-colors ${isGroupActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
              <span>{item.title}</span>
            </div>
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${
                productMenuOpen ? "rotate-180" : ""
              } ${isGroupActive ? "text-blue-600" : "text-slate-400"}`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              productMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="bg-slate-50/30">
              {item.children.map((child) => {
                const isSubActive = isPathActive(child.url);
                return (
                  <SidebarMenuButton
                    key={child.title}
                    asChild
                    isActive={isSubActive}
                    className={`h-11 pl-12 pr-4 transition-all duration-150 rounded-none relative border-r-[3px] ${
                      isSubActive
                        ? "bg-blue-50/60 text-blue-600 font-bold border-blue-600"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent font-medium"
                    }`}
                  >
                    <Link
                      href={child.url}
                      onClick={() => setOptimisticPathname(child.url)}
                      className="flex items-center text-[13px]"
                    >
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuButton>
                );
              })}
            </div>
          </div>
        </SidebarMenuItem>
      );
    }

    const isActive = isPathActive(item.url);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={`h-11 transition-all duration-150 rounded-none relative border-r-[3px] group/btn ${
            isActive
              ? "bg-blue-50 text-blue-600 font-bold border-blue-600"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent font-medium"
          }`}
        >
          <Link
            href={item.url!}
            onClick={() => setOptimisticPathname(item.url!)}
            className="flex items-center gap-3.5 px-5 py-2 text-[13.5px]"
          >
            <item.icon className={`size-[18px] transition-colors ${isActive ? "text-blue-600" : "text-slate-400 group-hover/btn:text-slate-600"}`} />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r border-slate-200 bg-white overflow-visible">
      <SidebarHeader className="h-16 border-b border-slate-100 bg-white p-0 overflow-visible">
        <div className="flex flex-row items-center justify-between h-full w-full px-5">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex size-7.5 items-center justify-center rounded bg-slate-900 text-white shadow-sm">
              <TrendingUp className="size-4" />
            </div>
            <span className="font-bold text-slate-800 text-[14px] tracking-tight antialiased">
              PETNEST ADMIN
            </span>
          </Link>
          
          <div className="shrink-0 flex items-center">
            <AdminNotificationBell adminId={adminId} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2 custom-scrollbar">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="p-0 mb-3 last:mb-0">
            <SidebarGroupLabel className="text-slate-400 uppercase text-[10px] tracking-[0.08em] font-bold px-5 py-2.5 leading-none">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {group.items.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-3 bg-white">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-slate-50 transition-colors group">
              <div className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200 group-hover:border-slate-300">
                <User className="size-4.5" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="font-semibold text-[13.5px] text-slate-900 truncate">Administrator</span>
                <span className="text-[11px] text-slate-400 truncate font-medium">admin@gmail.com</span>
              </div>
              <ChevronUp className="ml-auto size-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 rounded-md shadow-xl border-slate-200 p-1" side="top" align="start">
            <div className="px-2.5 py-2 mb-1 border-b border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tài khoản</p>
            </div>
            <DropdownMenuItem 
              className="rounded py-2 text-[13px] focus:bg-slate-50 cursor-pointer"
              onClick={() => (window.location.href = "/admin/profile")}
            >
              <User className="mr-2 h-4 w-4 text-slate-400" />
              Hồ sơ của tôi
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 rounded py-2 text-[13px] focus:bg-red-50 focus:text-red-600 cursor-pointer" onClick={handleLogout}>
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
