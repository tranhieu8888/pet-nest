import React from "react";
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

const Footer = () => {
  return (
    <footer className="bg-background border-t mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4">
            <PawPrint className="text-primary" />
            <span className="font-bold text-xl">PetNest</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Không chỉ là cửa hàng thú cưng. Chúng tôi mang đến sản phẩm chất
            lượng và dịch vụ chăm sóc chuyên nghiệp giúp bé cưng của bạn luôn
            khỏe mạnh và xinh xắn mỗi ngày.
          </p>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-semibold mb-4">Dịch vụ của chúng tôi</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-primary transition">
                🐶 Phụ kiện & Thức ăn
              </Link>
            </li>
            <li>
              <Link href="/spa" className="hover:text-primary transition">
                🛁 Spa & Tắm thú cưng
              </Link>
            </li>
            <li>
              <Link href="/grooming" className="hover:text-primary transition">
                ✂️ Tỉa lông & Grooming
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold mb-4">Hỗ trợ khách hàng</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail size={16} />
              support@petcarehub.vn
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

        {/* Social */}
        <div>
          <h4 className="font-semibold mb-4">Theo dõi chúng tôi</h4>
          <div className="flex gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition"
            >
              <Facebook />
            </a>
            <a href="#" className="hover:text-primary transition">
              <Instagram />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Cập nhật ưu đãi và mẹo chăm sóc thú cưng mỗi tuần.
          </p>
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
