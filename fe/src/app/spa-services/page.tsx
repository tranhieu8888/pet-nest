"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { AxiosError } from "axios";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "../../../utils/axios";
import { useRouter } from "next/navigation";

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

const ITEMS_PER_PAGE = 8;

function getSpaImageUrl(image?: string) {
  if (!image || !image.trim()) return "/placeholder.svg";

  const trimmed = image.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `http://localhost:5000${
    trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  }`;
}

function getCategoryLabel(category: SpaService["category"]) {
  switch (category) {
    case "spa":
      return "Spa";
    case "cleaning":
      return "Vệ sinh";
    case "grooming":
      return "Cắt tỉa";
    case "coloring":
      return "Nhuộm lông";
    default:
      return category;
  }
}

export default function SpaServicesPage() {
  const [spaServices, setSpaServices] = useState<SpaService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();

  const handleBookingClick = (serviceSlug: string) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      const isConfirm = window.confirm(
        "Bạn cần đăng nhập để đặt lịch spa 🐾\n\nNhấn OK để đi tới trang đăng nhập."
      );

      if (isConfirm) {
        router.push(
          `/login?redirect=${encodeURIComponent(`/spa-booking/${serviceSlug}`)}`
        );
      }

      return;
    }

    router.push(`/spa-booking/${serviceSlug}`);
  };

  useEffect(() => {
    const fetchSpaServices = async () => {
      try {
        setIsLoading(true);

        const response = await api.get("/spa-services");

        const servicesData = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        const activeServices = servicesData.filter(
          (service: SpaService) => service.isActive
        );

        setSpaServices(activeServices);
      } catch (err: unknown) {
        console.error("Error fetching spa services:", err);

        if (err instanceof AxiosError) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Có lỗi xảy ra khi tải danh sách dịch vụ spa"
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Có lỗi xảy ra khi tải danh sách dịch vụ spa");
        }

        setSpaServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSpaServices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [spaServices]);

  const totalPages = Math.ceil(spaServices.length / ITEMS_PER_PAGE);

  const currentServices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return spaServices.slice(startIndex, endIndex);
  }, [spaServices, currentPage]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-b from-pink-50 to-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Dịch vụ Spa thú cưng
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Khám phá các dịch vụ chăm sóc, vệ sinh và làm đẹp chuyên nghiệp
              dành cho thú cưng của bạn.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto" />
              <p className="mt-4 text-gray-600">Đang tải dịch vụ spa...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : spaServices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600">
                Hiện chưa có dịch vụ spa nào để hiển thị.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentServices.map((service, index) => (
                  <motion.div
                    key={service._id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: index * 0.06 }}
                    viewport={{ once: true }}
                    className="group"
                  >
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-pink-100">
                      <div className="relative h-56 bg-pink-50">
                        <Image
                          src={getSpaImageUrl(service.image)}
                          alt={service.name}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            {getCategoryLabel(service.category)}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors mb-2 line-clamp-2">
                          {service.name}
                        </h2>

                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                          {service.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {service.petTypes?.map((petType) => (
                            <span
                              key={petType}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                            >
                              {petType === "dog" ? "Chó" : "Mèo"}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-pink-600 font-bold text-xl">
                            {service.price.toLocaleString("vi-VN")}đ
                          </span>

                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock size={16} />
                            {service.durationMinutes} phút
                          </span>
                        </div>

                        <div className="mt-auto flex gap-2">
                          <Link
                            href={`/spa-services/${service.slug}`}
                            className="flex-1 text-center border border-pink-600 text-pink-600 hover:bg-pink-50 px-4 py-2.5 rounded-xl font-medium transition"
                          >
                            Xem chi tiết
                          </Link>
                          <button
                            onClick={() => handleBookingClick(service.slug)}
                            className="flex-1 text-center bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl font-medium transition"
                          >
                            Đặt lịch
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex flex-col items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Trang {currentPage} / {totalPages}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Trước
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => {
                      const page = index + 1;
                      const isActive = page === currentPage;

                      return (
                        <button
                          key={page}
                          onClick={() => handleGoToPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition ${
                            isActive
                              ? "bg-pink-600 text-white"
                              : "border border-pink-200 text-pink-600 hover:bg-pink-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
