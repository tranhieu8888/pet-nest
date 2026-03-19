"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Scissors,
  CalendarDays,
  ClipboardList,
  PawPrint,
  LogOut,
  User,
  ChevronUp,
  Settings,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import StaffNotificationBell from "./components/StaffNotificationBell";

const menuItems = [
  {
    title: "Lịch làm việc",
    url: "/staff/schedule",
    icon: CalendarDays,
  },
  {
    title: "Đơn dịch vụ",
    url: "/staff/services",
    icon: ClipboardList,
  },
  {
    title: "Khách hàng thú cưng",
    url: "/staff/customers",
    icon: PawPrint,
  },
  {
    title: "Chăm sóc & cắt tỉa",
    url: "/staff/grooming",
    icon: Scissors,
  },
];

function StaffSidebar({ staffId }: { staffId: string | null }) {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <Sidebar className="border-r bg-white shadow-xl overflow-visible">
      <SidebarHeader className="border-b bg-gradient-to-r from-emerald-500 to-teal-600 text-white overflow-visible">
        <div className="flex items-center justify-between px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/staff/schedule">
                  <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                    <Scissors className="size-5" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-bold text-lg">Staff Panel</span>
                    <span className="text-xs opacity-80">
                      Pet Nest & Grooming
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="shrink-0">
            <StaffNotificationBell staffId={staffId} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wider px-3">
            Khu vực nhân viên
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`transition-all duration-200 rounded-lg ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700 font-semibold"
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
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <User className="size-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-medium">Nhân viên</span>
                <span className="text-xs text-gray-500">
                  petnest.staff@gmail.com
                </span>
              </div>
              <ChevronUp className="ml-auto size-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 rounded-xl shadow-lg">
            <DropdownMenuItem
              onClick={() => (window.location.href = "/profile")}
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

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [staffId, setStaffId] = useState<string | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));

      if (decoded.role !== 2) {
        router.push("/");
        return;
      }

      setStaffId(decoded.id || decoded._id || null);
    } catch {
      router.push("/login");
    }
  }, [router]);

  return (
    <SidebarProvider>
      <StaffSidebar staffId={staffId} />

      <SidebarInset className="bg-gray-50 min-h-screen">
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
