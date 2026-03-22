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
} from "lucide-react";
import { useState, useEffect, type MouseEvent } from "react";
import { api } from "../../../utils/axios";
import { AxiosError } from "axios";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import viConfig from "../../../utils/petPagesConfig.vi";
import enConfig from "../../../utils/petPagesConfig.en";

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
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">{description}</p>
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
  const [activeSection, setActiveSection] = useState("banners");

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-110px 0px -45% 0px",
        threshold: [0.2, 0.4, 0.6],
      }
    );

    quickNavItems.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleQuickNavClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const headerOffset = 145;
    const elementTop = target.getBoundingClientRect().top + window.pageYOffset;
    const offsetTop = elementTop - headerOffset;

    window.scrollTo({
      top: offsetTop,
      behavior: "smooth",
    });

    setActiveSection(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900">
        <div className="pointer-events-none absolute -top-24 right-10 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-60 w-60 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Pet Nest Premium Experience
              </div>
              <h1 className="text-3xl font-extrabold leading-tight text-white md:text-5xl">
                Không gian mua sắm & chăm sóc thú cưng hiện đại
              </h1>
              <p className="mt-4 max-w-xl text-sm text-slate-200 md:text-base">
                Từ sản phẩm chất lượng đến dịch vụ spa chuyên nghiệp, mọi thứ bạn cần cho boss đều có tại Pet Nest.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/spa-services"
                  className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
                >
                  Đặt lịch spa ngay
                </Link>
                <Link
                  href="/products"
                  className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Mua sắm sản phẩm
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Khách hàng tin tưởng", value: "10,000+" },
                { label: "Sản phẩm & dịch vụ", value: "500+" },
                { label: "Đánh giá tích cực", value: "4.9/5" },
                { label: "Hỗ trợ", value: "24/7" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                  <div className="mt-1 text-xs text-slate-200">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-[72px] z-30 border-y border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto overflow-x-auto px-4 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-2 text-xs font-semibold md:text-sm">
            {quickNavItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(event) => handleQuickNavClick(event, item.id)}
                  className={`rounded-full border px-3 py-1.5 transition ${
                    isActive
                      ? "border-pink-200 bg-pink-50 text-pink-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-pink-300 hover:text-pink-600"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
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
                  <Link href={banner.link} className="relative block h-full w-full">
                    <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" priority={index === 0} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />
                    <div className="absolute inset-0 flex items-end p-6 md:p-10">
                      <div className="max-w-2xl text-white">
                        <h3 className="text-2xl font-bold md:text-4xl">{banner.title}</h3>
                        <p className="mt-3 text-sm text-slate-100 md:text-base">{banner.description}</p>
                        <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold">
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
                    className={`h-2.5 rounded-full transition-all ${
                      currentBannerIndex === idx ? "w-8 bg-pink-600" : "w-2.5 bg-white/70"
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
        <div className="rounded-3xl border border-pink-100 bg-gradient-to-b from-pink-50 to-white p-6 md:p-8">
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
                          className="rounded-lg border border-pink-200 px-3 py-2 text-center text-xs font-semibold text-pink-700 transition hover:bg-pink-50"
                        >
                          Chi tiết
                        </Link>
                        <Link
                          href={`/spa-booking/${service.slug}`}
                          className="rounded-lg bg-pink-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-pink-700"
                        >
                          Đặt lịch
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/spa-services"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Scissors className="h-4 w-4" />
                  Xem tất cả dịch vụ spa
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
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-square bg-slate-50">
                      {isOutOfStock && (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-2 py-1 text-[11px] font-semibold text-white">
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
            <Link
              href="/products/best-selling"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
            >
              {homepageConfig.bestSelling.linkText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-14">
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

      <section className="container mx-auto px-4 pb-8 md:pb-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.07 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm leading-relaxed text-slate-700">“{item.quote}”</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {item.rating}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 md:pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 p-7 text-white shadow-lg md:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-indigo-400/30 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Pet Nest Membership</p>
              <h3 className="mt-2 text-2xl font-extrabold md:text-3xl">Nhận ưu đãi độc quyền mỗi tuần cho boss của bạn</h3>
              <p className="mt-2 max-w-2xl text-sm text-white/90 md:text-base">
                Đăng ký thành viên để nhận mã giảm giá, lịch nhắc chăm sóc thú cưng và quyền đặt lịch ưu tiên.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-fuchsia-700 transition hover:bg-slate-100"
              >
                Đăng ký ngay
              </Link>
              <Link
                href="/spa-services"
                className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Xem dịch vụ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const quickNavItems = [
  { id: "banners", label: "Banner" },
  { id: "spa-services", label: "Spa Services" },
  { id: "shop-by-pet", label: "Shop by Pet" },
  { id: "popular", label: "Popular" },
  { id: "best-selling", label: "Best Selling" },
];

const testimonials = [
  {
    name: "Linh Trần",
    role: "Khách hàng thân thiết",
    quote: "Dịch vụ spa ở Pet Nest rất chuyên nghiệp, bé nhà mình đi về lúc nào cũng thơm và vui vẻ.",
    rating: "5.0 ★",
  },
  {
    name: "Minh Quân",
    role: "Chủ nuôi 2 bé mèo",
    quote: "Giao diện mới dễ dùng, đặt lịch nhanh. Nhân viên tư vấn cực kỳ nhiệt tình.",
    rating: "4.9 ★",
  },
  {
    name: "Hà Phương",
    role: "Khách hàng mới",
    quote: "Sản phẩm đa dạng, giá rõ ràng. Mình rất thích trải nghiệm mua sắm tại đây.",
    rating: "4.9 ★",
  },
];

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
