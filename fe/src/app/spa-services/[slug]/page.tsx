"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AxiosError } from "axios";
import { Clock } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "../../../../utils/axios";

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

function getValidImageUrl(url?: string, fallback = "/placeholder.svg") {
  return url && url.trim() ? url : fallback;
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

export default function SpaServiceDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [service, setService] = useState<SpaService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpaService = async () => {
      try {
        setIsLoading(true);

        const response = await api.get(`/spa-services/${slug}`);

        const serviceData = response.data?.data || null;
        console.log("SPA DETAIL DATA:", serviceData);
        setService(serviceData);
      } catch (err: unknown) {
        console.error("Error fetching spa service detail:", err);

        if (err instanceof AxiosError) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Có lỗi xảy ra khi tải chi tiết dịch vụ spa"
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Có lỗi xảy ra khi tải chi tiết dịch vụ spa");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      void fetchSpaService();
    }
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="py-16 bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto" />
              <p className="mt-4 text-gray-600">Đang tải chi tiết dịch vụ...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : !service ? (
            <div className="text-center py-16">
              <p className="text-gray-600">Không tìm thấy dịch vụ spa.</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div className="relative w-full h-[420px] rounded-2xl overflow-hidden shadow-lg bg-pink-50">
                <Image
                  src={getValidImageUrl(service.image, "/placeholder.svg")}
                  alt={service.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <div className="mb-4">
                  <span className="inline-block bg-pink-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                    {getCategoryLabel(service.category)}
                  </span>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {service.name}
                </h1>

                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {service.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {service.petTypes?.map((petType) => (
                    <span
                      key={petType}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full"
                    >
                      {petType === "dog" ? "Chó" : "Mèo"}
                    </span>
                  ))}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="text-3xl font-bold text-pink-600">
                    {service.price.toLocaleString("vi-VN")}đ
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={18} />
                    <span>{service.durationMinutes} phút</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/spa-booking/${service.slug}`}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                  >
                    Đặt lịch ngay
                  </Link>

                  <Link
                    href="/spa-services"
                    className="border border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-xl font-semibold transition"
                  >
                    Quay lại danh sách
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
