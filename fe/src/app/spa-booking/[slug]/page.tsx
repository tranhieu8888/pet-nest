"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AxiosError } from "axios";
import { CalendarDays, Clock, PawPrint } from "lucide-react";

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

interface Pet {
  _id: string;
  name: string;
  type: "dog" | "cat";
  breed?: string;
  age?: number | null;
  weight?: number | null;
  note?: string;
  allergies?: string;
  behaviorNote?: string;
  customerId?: string;
  userId?: string;
  ownerId?: string;
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

function formatDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getMinimumBookingTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return formatDateTimeLocal(now);
}

export default function SpaBookingPage() {
  const router = useRouter();
  const params = useParams();

  const serviceSlug = params?.slug as string;

  const [ready, setReady] = useState(false);
  const [service, setService] = useState<SpaService | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [petsError, setPetsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || sessionStorage.getItem("token")
        : null;

    if (!token) {
      const isConfirm = window.confirm(
        "Bạn cần đăng nhập để đặt lịch spa 🐾\n\nNhấn OK để đi tới trang đăng nhập."
      );

      if (isConfirm) {
        router.push(
          `/login?redirect=${encodeURIComponent(`/spa-booking/${serviceSlug}`)}`
        );
      } else {
        router.push(
          serviceSlug ? `/spa-services/${serviceSlug}` : "/spa-services"
        );
      }

      return;
    }

    setReady(true);
  }, [router, serviceSlug]);

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!ready) return;

      if (!serviceSlug) {
        setError(
          "Thiếu slug dịch vụ. Vui lòng chọn dịch vụ trước khi đặt lịch."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setServiceError(null);
        setPetsError(null);

        setService(null);
        setPets([]);
        setSelectedPetId("");
        setStartAt("");
        setNote("");

        const serviceResponse = await api.get(`/spa-services/${serviceSlug}`);
        const serviceData =
          serviceResponse.data?.data ||
          serviceResponse.data?.service ||
          serviceResponse.data ||
          null;

        console.log("BOOKING PARAM SLUG:", serviceSlug);
        console.log("BOOKING SERVICE DATA:", serviceData);

        if (!serviceData) {
          setServiceError("Không tìm thấy thông tin dịch vụ spa.");
        } else {
          setService(serviceData);
        }

        try {
          const petsResponse = await api.get("/pets/my-pets");

          const petsData = Array.isArray(petsResponse.data?.data)
            ? petsResponse.data.data
            : Array.isArray(petsResponse.data)
            ? petsResponse.data
            : [];

          setPets(petsData);

          if (petsData.length > 0) {
            setSelectedPetId(petsData[0]._id);
          }
        } catch (petErr: unknown) {
          if (petErr instanceof AxiosError) {
            setPetsError(
              petErr.response?.data?.message ||
                petErr.message ||
                "Không thể tải danh sách thú cưng"
            );
          } else if (petErr instanceof Error) {
            setPetsError(petErr.message);
          } else {
            setPetsError("Không thể tải danh sách thú cưng");
          }
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          const message =
            err.response?.data?.message ||
            err.message ||
            "Có lỗi xảy ra khi tải dịch vụ spa";

          setError(message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Có lỗi xảy ra khi tải dịch vụ spa");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchBookingData();
  }, [ready, serviceSlug]);

  const selectedPet = useMemo(
    () => pets.find((pet) => pet._id === selectedPetId) || null,
    [pets, selectedPetId]
  );

  const endAtPreview = useMemo(() => {
    if (!startAt || !service?.durationMinutes) return null;

    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) return null;

    const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

    return end.toLocaleString("vi-VN");
  }, [startAt, service]);

  const canSubmit = useMemo(() => {
    return !!service && !!selectedPetId && !!startAt && !submitting;
  }, [service, selectedPetId, startAt, submitting]);

  console.log("SERVICE STATE BEFORE SUBMIT:", service);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("CURRENT PARAM SLUG:", serviceSlug);
    console.log("SERVICE STATE BEFORE SUBMIT:", service);

    if (!service || service.slug !== serviceSlug) {
      setError(
        "Thông tin dịch vụ chưa đồng bộ, vui lòng đợi tải xong hoặc tải lại trang."
      );
      return;
    }

    if (!service?._id) {
      setError("Không xác định được dịch vụ cần đặt.");
      return;
    }

    if (!selectedPetId) {
      setError("Vui lòng chọn thú cưng.");
      return;
    }

    if (!startAt) {
      setError("Vui lòng chọn thời gian bắt đầu.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await api.post("/spa-bookings", {
        petId: selectedPetId,
        serviceSlug: service.slug,
        startAt,
        note: note.trim(),
      });

      if (response.data?.success) {
        setSuccessMessage(response.data?.message || "Đặt lịch spa thành công.");

        setTimeout(() => {
          router.push("/petProfile");
        }, 1200);
      } else {
        setError(response.data?.message || "Đặt lịch thất bại.");
      }
    } catch (err: unknown) {
      console.error("Create spa booking error:", err);

      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Có lỗi xảy ra khi đặt lịch"
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Có lỗi xảy ra khi đặt lịch");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-b from-pink-50 to-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Đặt lịch Spa thú cưng
                </h1>
                <p className="mt-2 text-gray-600">
                  Chọn thú cưng, thời gian phù hợp và xác nhận lịch hẹn của bạn.
                </p>
              </div>

              <Link
                href="/petProfile"
                className="inline-flex items-center justify-center rounded-xl border border-pink-600 px-5 py-3 font-semibold text-pink-600 transition hover:bg-pink-50"
              >
                Quản lý thú cưng
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto" />
                <p className="mt-4 text-gray-600">
                  Đang tải dữ liệu booking...
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <p className="text-red-600 font-medium">{error}</p>
                <div className="mt-4">
                  <Link
                    href="/spa-services"
                    className="inline-flex items-center border border-pink-600 text-pink-600 hover:bg-pink-50 px-5 py-2.5 rounded-xl font-medium transition"
                  >
                    Quay lại danh sách dịch vụ
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl border border-pink-100 shadow-md overflow-hidden sticky top-6">
                    {service ? (
                      <>
                        <div className="relative h-72 bg-pink-50">
                          <Image
                            src={getValidImageUrl(
                              service.image,
                              "/placeholder.svg"
                            )}
                            alt={service.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="bg-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                              {getCategoryLabel(service.category)}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          <h2 className="text-2xl font-bold text-gray-900">
                            {service.name}
                          </h2>

                          <p className="mt-3 text-gray-600 leading-relaxed">
                            {service.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {service.petTypes?.map((petType) => (
                              <span
                                key={petType}
                                className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                              >
                                {petType === "dog" ? "Chó" : "Mèo"}
                              </span>
                            ))}
                          </div>

                          <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Giá dịch vụ</span>
                              <span className="text-pink-600 text-2xl font-bold">
                                {service.price.toLocaleString("vi-VN")}đ
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Thời lượng</span>
                              <span className="flex items-center gap-2 text-gray-700 font-medium">
                                <Clock size={18} />
                                {service.durationMinutes} phút
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-6">
                        <p className="text-red-600">
                          {serviceError || "Không tải được thông tin dịch vụ."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="bg-white rounded-2xl border border-pink-100 shadow-md p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Thông tin đặt lịch
                    </h2>

                    {successMessage && (
                      <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700">
                        {successMessage}
                      </div>
                    )}

                    {petsError && (
                      <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
                        {petsError}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Chọn thú cưng
                        </label>

                        {pets.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-300 p-5 bg-gray-50">
                            <div className="flex items-start gap-3">
                              <PawPrint className="mt-0.5 text-pink-600" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  Bạn chưa có thú cưng nào
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Vui lòng thêm thú cưng trước khi đặt lịch spa.
                                </p>
                                <Link
                                  href="/petProfile"
                                  className="inline-flex mt-3 text-pink-600 hover:text-pink-700 font-medium"
                                >
                                  Đi đến trang quản lý thú cưng
                                </Link>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pets.map((pet) => {
                              const active = selectedPetId === pet._id;

                              return (
                                <button
                                  key={pet._id}
                                  type="button"
                                  onClick={() => setSelectedPetId(pet._id)}
                                  className={`text-left rounded-2xl border p-4 transition ${
                                    active
                                      ? "border-pink-600 bg-pink-50 shadow-sm"
                                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-50/40"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {pet.name}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {pet.type === "dog" ? "Chó" : "Mèo"}
                                        {pet.breed ? ` • ${pet.breed}` : ""}
                                      </p>

                                      {(pet.age || pet.weight) && (
                                        <p className="text-xs text-gray-500 mt-2">
                                          {pet.age ? `Tuổi: ${pet.age}` : ""}
                                          {pet.age && pet.weight ? " • " : ""}
                                          {pet.weight
                                            ? `Cân nặng: ${pet.weight}kg`
                                            : ""}
                                        </p>
                                      )}
                                    </div>

                                    {active && (
                                      <span className="text-xs font-semibold text-pink-600">
                                        Đã chọn
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="startAt"
                          className="block text-sm font-semibold text-gray-800 mb-2"
                        >
                          Chọn thời gian bắt đầu
                        </label>
                        <div className="relative">
                          <input
                            id="startAt"
                            type="datetime-local"
                            value={startAt}
                            min={getMinimumBookingTime()}
                            onChange={(e) => setStartAt(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                            required
                          />
                          <CalendarDays
                            size={18}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Vui lòng chọn thời gian từ 30 phút sau thời điểm hiện
                          tại.
                        </p>
                      </div>

                      {startAt && service && (
                        <div className="rounded-xl bg-pink-50 border border-pink-100 p-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Bắt đầu:</span>{" "}
                            {new Date(startAt).toLocaleString("vi-VN")}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-semibold">
                              Kết thúc dự kiến:
                            </span>{" "}
                            {endAtPreview || "--"}
                          </p>
                        </div>
                      )}

                      {selectedPet && (
                        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                          <p className="text-sm font-semibold text-gray-900 mb-2">
                            Ghi chú hồ sơ thú cưng
                          </p>

                          <div className="space-y-1 text-sm text-gray-600">
                            {selectedPet.note ? (
                              <p>
                                <span className="font-medium text-gray-800">
                                  Ghi chú:
                                </span>{" "}
                                {selectedPet.note}
                              </p>
                            ) : null}

                            {selectedPet.allergies ? (
                              <p>
                                <span className="font-medium text-gray-800">
                                  Dị ứng:
                                </span>{" "}
                                {selectedPet.allergies}
                              </p>
                            ) : null}

                            {selectedPet.behaviorNote ? (
                              <p>
                                <span className="font-medium text-gray-800">
                                  Hành vi:
                                </span>{" "}
                                {selectedPet.behaviorNote}
                              </p>
                            ) : null}

                            {!selectedPet.note &&
                              !selectedPet.allergies &&
                              !selectedPet.behaviorNote && (
                                <p>
                                  Chưa có ghi chú đặc biệt cho thú cưng này.
                                </p>
                              )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="note"
                          className="block text-sm font-semibold text-gray-800 mb-2"
                        >
                          Ghi chú thêm cho buổi hẹn
                        </label>
                        <textarea
                          id="note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={5}
                          placeholder="Ví dụ: bé nhát người lạ, cần chú ý vùng tai, ưu tiên gọi trước khi hoàn thành..."
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 resize-none"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={!canSubmit || pets.length === 0}
                          className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition"
                        >
                          {submitting
                            ? "Đang đặt lịch..."
                            : "Xác nhận đặt lịch"}
                        </button>

                        <Link
                          href={
                            service
                              ? `/spa-services/${service.slug}`
                              : "/spa-services"
                          }
                          className="flex-1 text-center border border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-xl font-semibold transition"
                        >
                          Quay lại
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
