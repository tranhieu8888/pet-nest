"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Truck,
  Clock,
  Shield,
  Heart,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Users,
  ShoppingBag,
  Star,
  MessageCircle,
  PawPrint,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../../../utils/axios";
import { AxiosError } from "axios";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import viConfig from "../../../utils/petPagesConfig.vi";
import enConfig from "../../../utils/petPagesConfig.en";
import { ButtonCore } from "@/components/core/ButtonCore";

interface Category {
  _id: string;
  name: string;
  description: string;
  totalOrders: number;
  image?: string;
  parentCategory?: string | null;
}

interface ParentCategory {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  link: string;
  status: string;
  buttonText: string;
}

function resolveBannerHref(rawLink?: string) {
  if (!rawLink?.trim()) return "/";

  const link = rawLink.trim();

  // Link tương đối: giữ nguyên đúng theo admin config
  if (link.startsWith("/")) {
    return link;
  }

  // Link tuyệt đối
  try {
    const parsed = new URL(link);
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";

    // Cùng domain FE => đổi về internal path nhưng giữ nguyên path/query/hash
    if (currentOrigin && parsed.origin === currentOrigin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    // Khác domain => giữ nguyên
    return link;
  } catch {
    // Trường hợp dữ liệu lỗi format, fallback an toàn
    return "/";
  }
}

interface ProductVariant {
  _id: string;
  images: { url: string }[];
  sellPrice: number;
  importedQuantity: number;
  orderedQuantity: number;
  availableQuantity: number;
}

interface ReviewUser {
  _id: string;
  name: string;
  avatar?: string;
}

interface ProductReview {
  _id: string;
  userId: ReviewUser | null;
  productId: string;
  rating: number;
  comment: string;
  images: { url: string }[];
  createdAt: string;
  updatedAt: string;
}

interface TopSellingProduct {
  _id: string;
  name: string;
  description: string;
  brand: string;
  category: Category[];
  createAt: string;
  updateAt: string;
  variants: ProductVariant[];
  reviews: ProductReview[];
}

interface SpaService {
  _id: string;
  name: string;
  slug: string;
  category: "spa" | "cleaning" | "grooming" | "coloring";
  description: string;
  petTypes: ("dog" | "cat")[];
  price: number;
  durationMinutes: number;
  isActive: boolean;
  image?: string;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-10 text-center md:mb-12">
      <div className="mb-3 flex items-center justify-center gap-2 opacity-80">
        <div className="h-1 w-6 rounded-full bg-pink-600/30" />
        <PawPrint className="h-5 w-5 text-pink-600 animate-pulse" />
        <div className="h-1 w-6 rounded-full bg-pink-600/30" />
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
        {description}
      </p>
    </div>
  );
}

function SectionSkeleton({ cols = 4 }: { cols?: 2 | 3 | 4 }) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-5 ${gridCols[cols]}`}>
      {Array.from({ length: cols * 2 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
          <div className="aspect-[16/10] rounded-xl bg-slate-200" />
          <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { lang } = useLanguage();
  const pagesConfig = lang === "vi" ? viConfig : enConfig;
  const homepageConfig = pagesConfig.homepage;

  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [spaServices, setSpaServices] = useState<SpaService[]>([]);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingParents, setIsLoadingParents] = useState(true);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isLoadingTopSelling, setIsLoadingTopSelling] = useState(true);
  const [isLoadingSpaServices, setIsLoadingSpaServices] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [parentError, setParentError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [topSellingError, setTopSellingError] = useState<string | null>(null);
  const [spaServicesError, setSpaServicesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularCategories = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/categories/popular");
        setPopularCategories(Array.isArray(response.data) ? response.data : []);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || err.message || "Failed to fetch categories");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to fetch categories");
        }
        setPopularCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPopularCategories();
  }, []);

  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        setIsLoadingParents(true);
        const response = await api.get("/categories/parent");
        setParentCategories(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setParentError(err.response?.data?.message || err.message || "Failed to fetch parent categories");
        } else if (err instanceof Error) {
          setParentError(err.message);
        } else {
          setParentError("Failed to fetch parent categories");
        }
        setParentCategories([]);
      } finally {
        setIsLoadingParents(false);
      }
    };

    void fetchParentCategories();
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoadingBanners(true);
        const response = await api.get("/banners");
        const list = Array.isArray(response.data) ? response.data : [];
        const now = new Date();
        const active = list.filter((banner) => {
          if (banner.status !== "active") return false;
          const start = new Date(banner.startDate);
          const end = new Date(banner.endDate);
          return start <= now && end >= now;
        });
        setBanners(active);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setBannerError(err.response?.data?.message || err.message || "Failed to fetch banners");
        } else if (err instanceof Error) {
          setBannerError(err.message);
        } else {
          setBannerError("Failed to fetch banners");
        }
        setBanners([]);
      } finally {
        setIsLoadingBanners(false);
      }
    };

    void fetchBanners();
  }, []);

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        setIsLoadingTopSelling(true);
        const response = await api.get("/products/best-selling");
        if (response.data?.success) {
          setTopSellingProducts(Array.isArray(response.data.data) ? response.data.data : []);
        } else {
          setTopSellingProducts([]);
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setTopSellingError(err.response?.data?.message || err.message || "Failed to fetch best-selling products");
        } else if (err instanceof Error) {
          setTopSellingError(err.message);
        } else {
          setTopSellingError("Failed to fetch best-selling products");
        }
        setTopSellingProducts([]);
      } finally {
        setIsLoadingTopSelling(false);
      }
    };

    void fetchTopSellingProducts();
  }, []);

  useEffect(() => {
    const fetchSpaServices = async () => {
      try {
        setIsLoadingSpaServices(true);
        const response = await api.get("/spa-services");
        const services = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];

        setSpaServices(services.filter((service: SpaService) => service.isActive));
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setSpaServicesError(err.response?.data?.message || err.message || "Failed to fetch spa services");
        } else if (err instanceof Error) {
          setSpaServicesError(err.message);
        } else {
          setSpaServicesError("Failed to fetch spa services");
        }
        setSpaServices([]);
      } finally {
        setIsLoadingSpaServices(false);
      }
    };

    void fetchSpaServices();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);



  return (
    <div className="w-full min-h-screen bg-[#fafafc] text-slate-900 selection:bg-pink-100 selection:text-pink-700">
      <Header />

      {/* ─── HERO SECTION ─── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 min-h-[520px] md:min-h-[600px] flex flex-col justify-center">
        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute -top-28 -right-16 h-96 w-96 rounded-full bg-pink-600/20 blur-[80px] animate-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-[72px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-56 w-56 -translate-y-1/2 rounded-full bg-pink-500/10 blur-[64px]" />
        <div className="pointer-events-none absolute top-0 right-1/4 h-40 w-40 rounded-full bg-indigo-400/10 blur-[60px]" />

        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="container mx-auto px-6 py-14 md:py-20">
          <div className="grid items-center gap-12 md:grid-cols-[1fr_1fr] lg:grid-cols-[5fr_7fr]">

            {/* LEFT: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              {/* Headline */}
              <h1 className="text-3xl font-extrabold leading-tight text-white md:text-5xl lg:text-[3.1rem]">
                Không gian{" "}
                <span className="bg-gradient-to-r from-pink-400 to-pink-300 bg-clip-text text-transparent">
                  mua sắm
                </span>{" "}
                &amp; chăm sóc{" "}
                <span className="bg-gradient-to-r from-indigo-300 to-slate-200 bg-clip-text text-transparent">
                  thú cưng
                </span>{" "}
                hiện đại
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-300 md:text-base">
                Từ sản phẩm chất lượng đến dịch vụ spa chuyên nghiệp, mọi thứ bạn cần cho boss đều có tại{" "}
                <span className="font-semibold text-white">Pet Nest</span>.
              </p>

              {/* CTA Buttons – dùng ButtonCore để đồng nhất màu sắc */}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/spa-services" id="hero-cta-spa" className="btn-glowing-wrapper bg-pink-600 shadow-xl shadow-pink-500/10 active:scale-95 transition-transform !rounded-2xl h-12">
                  <ButtonCore
                    variantType="primary"
                    leftIcon={<Scissors className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />}
                    className="h-full px-8 rounded-2xl border-none shadow-none"
                  >
                    Đặt lịch spa ngay
                  </ButtonCore>
                </Link>
                <Link href="/products" id="hero-cta-shop" className="h-12">
                  <ButtonCore
                    variantType="secondary"
                    leftIcon={<ShoppingBag className="h-4 w-4" />}
                    rightIcon={<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
                    className="h-full px-8 rounded-2xl border-none"
                  >
                    Mua sắm ngay
                  </ButtonCore>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-7 flex flex-wrap items-center gap-5 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  Sản phẩm chính hãng
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-sky-400" />
                  Giao hàng nhanh chóng
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-pink-400" />
                  Hỗ trợ 24/7
                </span>
              </div>
            </motion.div>

            {/* RIGHT: Pet image + Stats cards — layout ngang để dùng hết chiều rộng cột */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease: "easeOut", delay: 0.15 }}
              className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between"
            >
              {/* Pet illustration with glowing animated border */}
              <div className="relative mx-auto shrink-0 group transition-transform duration-700 hover:scale-[1.03]">
                <div className="absolute inset-0 rounded-full bg-pink-500/25 blur-3xl scale-110 animate-pulse" />
                
                {/* Glowing Wrapper */}
                <div className="glowing-wrapper glow-blur rounded-full bg-slate-900 p-[3px] shadow-2xl">
                  <div className="relative h-56 w-56 overflow-hidden rounded-full border-2 border-white/10 bg-slate-800 md:h-64 md:w-64 lg:h-72 lg:w-72">
                    <Image
                      src="/hero-pets.png"
                      alt="Thú cưng tại Pet Nest"
                      fill
                      className="object-cover scale-110 transition-transform duration-700 group-hover:scale-[1.15]"
                      priority
                    />
                  </div>
                </div>

                {/* Floating label */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold text-white backdrop-blur-md shadow-xl"
                >
                  <span className="inline-flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-pink-300" />
                    Boss được yêu thương
                  </span>
                </motion.div>
              </div>

              {/* Stats grid – 2×2, fill hết chiều rộng còn lại */}
              <div className="grid w-full grid-cols-2 gap-3 lg:max-w-xs xl:max-w-sm">
                {[
                  { label: "Khách hàng tin tưởng", value: "10,000+", icon: <Users className="h-5 w-5 text-white/80" />, border: "border-white/10", bg: "bg-white/10" },
                  { label: "Sản phẩm & dịch vụ", value: "500+", icon: <ShoppingBag className="h-5 w-5 text-pink-300" />, border: "border-pink-500/25", bg: "bg-pink-600/10" },
                  { label: "Đánh giá tích cực", value: "4.9/5", icon: <Star className="h-5 w-5 text-white/80" />, border: "border-white/10", bg: "bg-white/10" },
                  { label: "Hỗ trợ liên tục", value: "24/7", icon: <MessageCircle className="h-5 w-5 text-indigo-300" />, border: "border-indigo-400/25", bg: "bg-indigo-600/10" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.09 }}
                    className={`rounded-2xl border ${item.border} ${item.bg} p-4 backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-xl font-extrabold text-white md:text-2xl">{item.value}</span>
                    </div>
                    <div className="mt-1.5 text-[11px] font-medium text-slate-300 leading-tight">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* Straight Divider matches the background */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />
      </section>



      <section id="banners" className="container mx-auto px-4 py-8 md:py-10">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {isLoadingBanners ? (
            <div className="flex h-[420px] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-pink-600" />
            </div>
          ) : bannerError ? (
            <div className="flex h-[420px] items-center justify-center px-4 text-center text-red-600">{bannerError}</div>
          ) : banners.length > 0 ? (
            <div className="relative h-[420px] md:h-[520px]">
              {banners.map((banner, index) => (
                <motion.div
                  key={banner._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentBannerIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Link href={resolveBannerHref(banner.link)} className="relative block h-full w-full">
                    <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" priority={index === 0} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />
                    <div className="absolute inset-0 flex items-end p-6 md:p-10">
                      <div className="max-w-2xl text-white">
                        <h3 className="text-2xl font-bold md:text-4xl">{banner.title}</h3>
                        <p className="mt-3 text-sm text-slate-100 md:text-base">{banner.description}</p>
                        <span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-2.5 text-sm font-bold shadow-lg shadow-pink-500/20 transition-transform active:scale-95">
                          {banner.buttonText || "Xem ngay"}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white"
                aria-label="Previous banner"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white"
                aria-label="Next banner"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`h-2.5 rounded-full transition-all ${currentBannerIndex === idx ? "w-8 bg-pink-600" : "w-2.5 bg-white/70"
                      }`}
                    aria-label={`Go to banner ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[420px] items-center justify-center text-slate-500">Không có banner để hiển thị</div>
          )}
        </div>
      </section>

      <section id="spa-services" className="container mx-auto px-4 py-8 md:py-14">
        <div className="relative rounded-3xl p-6 md:p-8">
          {/* Subtle Ambient Orb for Services */}
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-pink-500/5 blur-[100px]" />
          <SectionHeading
            title="Dịch vụ Spa thú cưng"
            description="Chăm sóc toàn diện với quy trình chuyên nghiệp, an toàn và phù hợp từng giống loài."
          />

          {isLoadingSpaServices ? (
            <SectionSkeleton cols={4} />
          ) : spaServicesError ? (
            <div className="rounded-xl bg-red-50 p-4 text-center text-red-600">{spaServicesError}</div>
          ) : spaServices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {spaServices.slice(0, 8).map((service) => (
                  <motion.div
                    key={service._id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="group overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100"
                  >
                    <div className="relative h-44 overflow-hidden bg-pink-50">
                      <Image
                        src={getSpaImageUrl(service.image)}
                        alt={service.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-pink-700 shadow">
                        {service.category}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-bold text-slate-900 md:text-base">{service.name}</h3>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600 md:text-sm">{service.description}</p>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>{service.durationMinutes} phút</span>
                        <span className="font-bold text-pink-600">{service.price.toLocaleString("vi-VN")}đ</span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          href={`/spa-services/${service.slug}`}
                          className="rounded-xl border border-pink-100 px-3 py-2 text-center text-xs font-bold text-pink-700 transition-all hover:bg-pink-50 hover:border-pink-200"
                        >
                          Chi tiết
                        </Link>
                        <Link
                          href={`/spa-booking/${service.slug}`}
                          className="rounded-xl bg-pink-600 px-3 py-2 text-center text-xs font-bold text-white transition-all hover:bg-pink-700 shadow-sm shadow-pink-100"
                        >
                          Đặt lịch
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link href="/spa-services">
                  <ButtonCore
                    variantType="secondary"
                    leftIcon={<Scissors className="h-4 w-4" />}
                  >
                    Xem tất cả dịch vụ spa
                  </ButtonCore>
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-slate-100 p-4 text-center text-slate-500">Hiện chưa có dịch vụ spa</div>
          )}
        </div>
      </section>

      <section id="shop-by-pet" className="container mx-auto px-4 py-8 md:py-14">
        <SectionHeading
          title={homepageConfig.shopByPet.title}
          description={homepageConfig.shopByPet.description}
        />

        {isLoadingParents ? (
          <SectionSkeleton cols={4} />
        ) : parentError ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-red-600">{parentError}</div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {parentCategories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <Link href={`/category/${category._id}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                    <Image
                      src={getValidImageUrl(category.image)}
                      alt={category.name}
                      fill
                      priority={index === 0}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                      <h3 className="text-lg font-bold text-white md:text-2xl">{category.name}</h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section id="popular" className="container mx-auto px-4 py-8 md:py-14">
        <SectionHeading
          title={homepageConfig.popularCategories.title}
          description={homepageConfig.popularCategories.description}
        />

        {isLoading ? (
          <SectionSkeleton cols={3} />
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-red-600">{error}</div>
        ) : popularCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {popularCategories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <Link
                  href={`/category/${category._id}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
                    <Image src={getValidImageUrl(category.image)} alt={category.name} fill className="object-cover" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-pink-600">{category.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{category.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100 p-4 text-center text-slate-500">Không có danh mục phổ biến</div>
        )}
      </section>

      <section id="best-selling" className="container mx-auto px-4 py-8 md:py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <SectionHeading
            title={homepageConfig.bestSelling.title}
            description={homepageConfig.bestSelling.description}
          />

          {isLoadingTopSelling ? (
            <SectionSkeleton cols={4} />
          ) : topSellingError ? (
            <div className="rounded-xl bg-red-50 p-4 text-center text-red-600">{topSellingError}</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {topSellingProducts.slice(0, 8).map((product) => {
                const minPriceVariant =
                  Array.isArray(product.variants) && product.variants.length > 0
                    ? product.variants.reduce((min, v) => (v.sellPrice < min.sellPrice ? v : min), product.variants[0])
                    : null;

                let firstImage = "/placeholder.svg";
                if (Array.isArray(product.variants)) {
                  for (const v of product.variants) {
                    if (Array.isArray(v.images) && v.images[0]?.url) {
                      firstImage = v.images[0].url;
                      break;
                    }
                  }
                }

                const isOutOfStock =
                  Array.isArray(product.variants) && product.variants.length > 0
                    ? product.variants.every((v) => v.availableQuantity <= 0)
                    : false;

                return (
                  <Link
                    href={`/product/${product._id}`}
                    key={product._id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/50"
                  >
                    <div className="relative aspect-square bg-slate-50">
                      {isOutOfStock && (
                        <span className="absolute left-3 top-3 z-10 rounded-lg bg-red-600/90 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
                          Hết hàng
                        </span>
                      )}
                      <Image src={getValidImageUrl(firstImage)} alt={product.name} fill className="object-contain p-3" />
                    </div>

                    <div className="p-4">
                      <p className="line-clamp-1 text-xs font-semibold uppercase tracking-wider text-pink-600">
                        {product.brand || "THƯƠNG HIỆU"}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 md:text-base">{product.name}</h3>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600 md:text-sm">{product.description}</p>
                      <p className="mt-4 text-lg font-extrabold text-red-600">
                        {(minPriceVariant?.sellPrice || 0).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/products/best-selling">
              <ButtonCore
                variantType="secondary"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {homepageConfig.bestSelling.linkText}
              </ButtonCore>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative container mx-auto px-4 py-10 md:py-14">
        {/* Subtle Ambient Orb for Benefits */}
        <div className="pointer-events-none absolute left-0 bottom-0 h-96 w-96 rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <SectionHeading
            title={homepageConfig.whyShop.title}
            description={homepageConfig.whyShop.description}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center"
              >
                <div className="mb-4 inline-flex rounded-xl bg-pink-100 p-3 text-pink-600">{benefit.icon}</div>
                <h3 className="text-base font-bold text-slate-900 md:text-lg">{benefit.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


const benefits = [
  {
    icon: <Truck size={24} />,
    title: "Giao hàng nhanh chóng",
    description: "Miễn phí vận chuyển cho đơn hàng từ 500.000đ",
  },
  {
    icon: <Clock size={24} />,
    title: "Giao hàng đúng giờ",
    description: "Cam kết giao hàng trong vòng 24h",
  },
  {
    icon: <Shield size={24} />,
    title: "Sản phẩm chính hãng",
    description: "100% sản phẩm được bảo hành chính hãng",
  },
  {
    icon: <Heart size={24} />,
    title: "Chăm sóc khách hàng",
    description: "Hỗ trợ 24/7 với đội ngũ tư vấn chuyên nghiệp",
  },
];

function getValidImageUrl(url?: string, fallback = "/placeholder.svg") {
  return url && url.trim() ? url : fallback;
}

function getSpaImageUrl(image?: string) {
  if (!image || !image.trim()) return "/placeholder.svg";

  const trimmed = image.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `http://localhost:5000${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
