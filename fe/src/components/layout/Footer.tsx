import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo & Description */}
        <div>
          <Link href="/" className="flex items-center gap-2 mb-3">
            <img src="/file.svg" alt="Logo" className="w-10 h-10" />
            <span className="font-bold text-lg">PestNest</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Nền tảng mua sắm thú cưng và phụ kiện đáng tin cậy, thân thiện với mọi người dùng.
          </p>
        </div>
        {/* Quick Links */}
        <div>
          <h4 className="font-semibold mb-3">Liên kết nhanh</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/homepage" className="hover:underline">Sản phẩm</Link></li>
            <li><Link href="/blog" className="hover:underline">Blog</Link></li>
          </ul>
        </div>
        {/* Contact Info */}
        <div>
          <h4 className="font-semibold mb-3">Liên hệ</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail size={16} /> anhnphe171575@fpt.edu.vn</li>
            <li className="flex items-center gap-2"><Phone size={16} /> 086 2126326</li>
            <li className="flex items-center gap-2"><MapPin size={16} /> Thông 4, Thạch Hòa, Thạch Thất, Hà Nội</li>
          </ul>
        </div>
        {/* Social Media */}
        <div>
          <h4 className="font-semibold mb-3">Kết nối với chúng tôi</h4>
          <div className="flex gap-4">
            <a href="https://facebook.com/devnguyen23" target="_blank" rel="noopener" aria-label="Facebook" className="hover:text-primary"><Facebook /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-center gap-2">
        <span>&copy; {new Date().getFullYear()} PestNest. All rights reserved.</span>
        <span className="flex items-center gap-1">Made with <Heart size={14} className="text-red-500" /> by PestNest Team</span>
      </div>
    </footer>
  );
};

export default Footer;
