"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { usePathname } from "next/navigation";
import {
  TrendingUp,
  LogOut,
  User,
  Users,
  ChevronUp,
  Megaphone,
  LifeBuoy,
  Star,
  Gift,
  Image,
  Settings,
  MessageCircle,
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
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";

// Menu items
const menuItems = [
  {
    title: "Admin Dashboard",
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
    title: "Quản lý banner",
    url: "/admin/banner",
    icon: Image,
  },
  {
    title: "Quản lý đánh giá",
    url: "/admin/review",
    icon: Star,
  },
  {
    title: "Quản lý voucher",
    url: "/admin/voucher",
    icon: Gift,
  },
  {
    title: "Chăm sóc khách hàng",
    url: "/messages",
    icon: MessageCircle,
  },
  {
    title: "Yêu cầu hỗ trợ",
    url: "/admin/supportrequest",
    icon: LifeBuoy,
  },
];

function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <Sidebar className="border-r bg-white shadow-xl">
      <SidebarHeader className="border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <TrendingUp className="size-5" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-lg">Admin Panel</span>
                  <span className="text-xs opacity-80">Management System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wider px-3">
            Quản lý hệ thống
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`transition-all duration-200 rounded-lg ${isActive
                        ? "bg-indigo-100 text-indigo-600 font-semibold"
                        : "hover:bg-gray-100"
                        }`}
                    >
                      <Link
                        href={item.url}
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
            <DropdownMenuItem
              onClick={() => (window.location.href = "profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Hồ sơ
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Cài đặt
            </DropdownMenuItem>

            <DropdownMenuSeparator />

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
      }
    } catch {
      router.push("/login");
    }
  }, []);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
