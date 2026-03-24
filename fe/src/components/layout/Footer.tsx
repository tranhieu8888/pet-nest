"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  PawPrint,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../utils/axios";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/subscribers", { email });

      if (response.data.success) {
        toast.success(response.data.message || "Đăng ký thành công");
        setEmail("");
      } else {
        toast.error(response.data.message || "Đăng ký thất bại");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi đăng ký email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-background border-t mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4 group">
            <div className="bg-pink-600 p-1.5 rounded-lg shadow-md shadow-pink-100 transition-transform group-hover:scale-110">
              <PawPrint className="text-white h-5 w-5" />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">Pet<span className="text-pink-600">Nest</span></span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Không chỉ là cửa hàng thú cưng. Chúng tôi mang đến sản phẩm chất
            lượng và dịch vụ chăm sóc chuyên nghiệp giúp bé cưng của bạn luôn
            khỏe mạnh và xinh xắn mỗi ngày.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Dịch vụ của chúng tôi</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-pink-600 transition-colors">
                🐶 Phụ kiện & Thức ăn
              </Link>
            </li>
            <li>
              <Link href="/spa" className="hover:text-pink-600 transition-colors">
                🛁 Spa & Tắm thú cưng
              </Link>
            </li>
            <li>
              <Link href="/grooming" className="hover:text-pink-600 transition-colors">
                ✂️ Tỉa lông & Grooming
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Hỗ trợ khách hàng</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail size={16} />
              support@petnest.vn
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} />
              0909 123 456
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} />
              Hà Nội, Việt Nam
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Đăng ký nhận tin</h4>

          <form onSubmit={handleSubscribe} className="space-y-3">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-pink-600 text-white px-4 py-2.5 text-sm font-bold hover:bg-pink-700 transition shadow-lg shadow-pink-100 disabled:opacity-50"
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground mt-3">
            Sau khi đăng ký, bạn sẽ nhận email xác nhận.
          </p>

          <div className="flex gap-4 mt-5">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-pink-600 transition-colors"
            >
              <Facebook />
            </a>
            <a href="#" className="text-slate-400 hover:text-pink-600 transition-all">
              <Instagram />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t py-5 text-center text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-center gap-2">
        <span>
          © {new Date().getFullYear()} PetCare Hub. All rights reserved.
        </span>
        <span className="flex items-center gap-1">
          Chăm sóc bằng cả trái tim{" "}
          <Heart size={14} className="text-rose-500" />
        </span>
      </div>
    </footer>
  );
};

export default Footer;
