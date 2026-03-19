"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { PawPrint, Plus, Pencil, Trash2, X } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "../../../utils/axios";
import { toast } from "sonner";

interface Pet {
  _id: string;
  name: string;
  type: "dog" | "cat";
  breed?: string;
  gender?: "male" | "female" | "unknown";
  age?: number | null;
  weight?: number | null;
  note?: string;
  allergies?: string;
  behaviorNote?: string;
  image?: string;
  isActive?: boolean;
}

interface PetFormData {
  name: string;
  type: "" | "dog" | "cat";
  breed: string;
  gender: "" | "male" | "female" | "unknown";
  age: string;
  weight: string;
  note: string;
  allergies: string;
  behaviorNote: string;
  image: File | null;
}

interface FormErrors {
  name?: string;
  type?: string;
  breed?: string;
  gender?: string;
  age?: string;
  weight?: string;
  note?: string;
  allergies?: string;
  behaviorNote?: string;
  image?: string;
}

const initialForm: PetFormData = {
  name: "",
  type: "",
  breed: "",
  gender: "",
  age: "",
  weight: "",
  note: "",
  allergies: "",
  behaviorNote: "",
  image: null,
};

function getPetTypeLabel(type: Pet["type"]) {
  return type === "dog" ? "Chó" : "Mèo";
}

function getGenderLabel(gender?: Pet["gender"]) {
  switch (gender) {
    case "male":
      return "Đực";
    case "female":
      return "Cái";
    default:
      return "Không rõ";
  }
}

function buildPayload(form: PetFormData) {
  const formData = new FormData();

  formData.append("name", form.name.trim());
  formData.append("type", form.type);
  formData.append("breed", form.breed.trim());
  formData.append("gender", form.gender);
  formData.append("age", form.age.trim());
  formData.append("weight", form.weight.trim());
  formData.append("note", form.note.trim());
  formData.append("allergies", form.allergies.trim());
  formData.append("behaviorNote", form.behaviorNote.trim());

  if (form.image) {
    formData.append("image", form.image);
  }

  return formData;
}

function validateForm(form: PetFormData, isEditing = false): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Tên thú cưng không được để trống";
  }

  if (!form.type.trim()) {
    errors.type = "Loại thú cưng không được để trống";
  } else if (!["dog", "cat"].includes(form.type)) {
    errors.type = "Loại thú cưng không hợp lệ";
  }

  if (!form.breed.trim()) {
    errors.breed = "Giống không được để trống";
  }

  if (!form.gender.trim()) {
    errors.gender = "Giới tính không được để trống";
  } else if (!["male", "female", "unknown"].includes(form.gender)) {
    errors.gender = "Giới tính không hợp lệ";
  }

  if (!form.age.trim()) {
    errors.age = "Tuổi không được để trống";
  } else if (Number.isNaN(Number(form.age))) {
    errors.age = "Tuổi phải là số hợp lệ";
  } else if (Number(form.age) < 0) {
    errors.age = "Tuổi không được nhỏ hơn 0";
  }

  if (!form.weight.trim()) {
    errors.weight = "Cân nặng không được để trống";
  } else if (Number.isNaN(Number(form.weight))) {
    errors.weight = "Cân nặng phải là số hợp lệ";
  } else if (Number(form.weight) < 0) {
    errors.weight = "Cân nặng không được nhỏ hơn 0";
  }

  if (!isEditing && !form.image) {
    errors.image = "Ảnh thú cưng không được để trống";
  }

  return errors;
}

export default function PetProfilePage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [form, setForm] = useState<PetFormData>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"" | "dog" | "cat">("");
  const [currentPage, setCurrentPage] = useState(1);

  // Preview image state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const itemsPerPage = 6;

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/pets/my-pets");
      const petsData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];

      setPets(petsData);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Không thể tải danh sách thú cưng";
        setError(message);
        toast.error(message);
      } else if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Không thể tải danh sách thú cưng");
        toast.error("Không thể tải danh sách thú cưng");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPets();
  }, []);

  const filteredPets = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return pets.filter((pet) => {
      const matchesSearch =
        !keyword ||
        pet.name?.toLowerCase().includes(keyword) ||
        pet.breed?.toLowerCase().includes(keyword) ||
        pet.note?.toLowerCase().includes(keyword) ||
        pet.allergies?.toLowerCase().includes(keyword) ||
        pet.behaviorNote?.toLowerCase().includes(keyword);

      const matchesType = !filterType || pet.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [pets, searchTerm, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredPets.length / itemsPerPage));

  const paginatedPets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPets, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenCreate = () => {
    setEditingPet(null);
    setForm(initialForm);
    setFieldErrors({});
    setPreviewImage(null);
    setOpenModal(true);
    setError(null);
  };

  function getPetImageUrl(image?: string) {
    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `http://localhost:5000${
      image.startsWith("/") ? image : `/${image}`
    }`;
  }

  const handleOpenEdit = (pet: Pet) => {
    setEditingPet(pet);
    setForm({
      name: pet.name || "",
      type: pet.type || "",
      breed: pet.breed || "",
      gender: pet.gender || "",
      age: pet.age !== null && pet.age !== undefined ? String(pet.age) : "",
      weight:
        pet.weight !== null && pet.weight !== undefined
          ? String(pet.weight)
          : "",
      note: pet.note || "",
      allergies: pet.allergies || "",
      behaviorNote: pet.behaviorNote || "",
      image: null,
    });
    setFieldErrors({});
    setPreviewImage(pet.image ? getPetImageUrl(pet.image) : null);
    setOpenModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setOpenModal(false);
    setEditingPet(null);
    setForm(initialForm);
    setFieldErrors({});
    setPreviewImage(null);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.type === "file") {
      const file = e.target.files?.[0] || null;
      setForm((prev) => ({ ...prev, [name]: file }));
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
      // Preview image logic
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm(form, !!editingPet);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Vui lòng kiểm tra lại thông tin.");
      toast.error("Vui lòng kiểm tra lại thông tin.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = buildPayload(form);

      if (editingPet?._id) {
        await api.put(`/pets/${editingPet._id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Cập nhật thú cưng thành công.");
      } else {
        await api.post("/pets", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Thêm thú cưng thành công.");
      }

      setOpenModal(false);
      setEditingPet(null);
      setForm(initialForm);
      setFieldErrors({});
      await fetchPets();
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const backendErrors = err.response?.data?.errors;

        if (backendErrors && typeof backendErrors === "object") {
          setFieldErrors(backendErrors);
        }

        const message =
          err.response?.data?.message ||
          err.message ||
          "Không thể lưu thông tin thú cưng";

        setError(message);
        toast.error(message);
      } else if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Không thể lưu thông tin thú cưng");
        toast.error("Không thể lưu thông tin thú cưng");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (petId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa thú cưng này?");
    if (!confirmed) return;

    try {
      setError(null);

      await api.delete(`/pets/${petId}`);
      toast.success("Đã xóa thú cưng thành công.");
      await fetchPets();
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Không thể xóa thú cưng";
        setError(message);
        toast.error(message);
      } else if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Không thể xóa thú cưng");
        toast.error("Không thể xóa thú cưng");
      }
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-b from-pink-50 to-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
                  Quản lý thú cưng
                </h1>
                <p className="mt-2 text-gray-600">
                  Thêm, chỉnh sửa và cập nhật hồ sơ thú cưng để đặt lịch nhanh
                  hơn.
                </p>
              </div>

              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700"
              >
                <Plus size={18} />
                Thêm thú cưng
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Tìm kiếm thú cưng
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên, giống, ghi chú, dị ứng..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Lọc theo loại
                </label>
                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as "" | "dog" | "cat")
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                >
                  <option value="">Tất cả</option>
                  <option value="dog">Chó</option>
                  <option value="cat">Mèo</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-pink-600" />
                <p className="mt-4 text-gray-600">
                  Đang tải danh sách thú cưng...
                </p>
              </div>
            ) : pets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-pink-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-50">
                  <PawPrint className="text-pink-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Bạn chưa có thú cưng nào
                </h2>
                <p className="mt-2 text-gray-600">
                  Hãy thêm hồ sơ thú cưng để có thể đặt lịch spa và lưu thông
                  tin chăm sóc.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700"
                >
                  <Plus size={18} />
                  Thêm thú cưng đầu tiên
                </button>
              </div>
            ) : filteredPets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-pink-200 bg-white p-10 text-center shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Không tìm thấy thú cưng phù hợp
                </h2>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedPets.map((pet) => (
                    <div
                      key={pet._id}
                      className="rounded-2xl border border-pink-100 bg-white p-6 shadow-md"
                    >
                      {pet.image ? (
                        <img
                          src={getPetImageUrl(pet.image)}
                          alt={pet.name}
                          className="mb-4 h-48 w-full rounded-xl object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="mb-4 flex h-48 w-full items-center justify-center rounded-xl bg-pink-50 text-pink-400">
                          <PawPrint size={40} />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
                            {getPetTypeLabel(pet.type)}
                          </div>
                          <h2 className="mt-3 text-2xl font-bold text-gray-900">
                            {pet.name}
                          </h2>
                          <p className="mt-1 text-sm text-gray-600">
                            {pet.breed || "Chưa cập nhật giống"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEdit(pet)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-pink-300 hover:text-pink-600"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(pet._id)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-red-300 hover:text-red-600"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold text-gray-900">
                            Giới tính:
                          </span>{" "}
                          {getGenderLabel(pet.gender)}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">
                            Tuổi:
                          </span>{" "}
                          {pet.age ?? "Chưa cập nhật"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">
                            Cân nặng:
                          </span>{" "}
                          {pet.weight ? `${pet.weight} kg` : "Chưa cập nhật"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">
                            Dị ứng:
                          </span>{" "}
                          {pet.allergies || "Không có"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">
                            Hành vi:
                          </span>{" "}
                          {pet.behaviorNote || "Chưa cập nhật"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">
                            Ghi chú:
                          </span>{" "}
                          {pet.note || "Không có"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPets.length > 0 && (
                  <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-sm text-gray-600">
                      Hiển thị{" "}
                      <span className="font-semibold text-gray-900">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>
                      {" - "}
                      <span className="font-semibold text-gray-900">
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredPets.length
                        )}
                      </span>{" "}
                      trên tổng số{" "}
                      <span className="font-semibold text-gray-900">
                        {filteredPets.length}
                      </span>{" "}
                      thú cưng
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Trang trước
                      </button>

                      <div className="rounded-xl bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700">
                        Trang {currentPage} / {totalPages}
                      </div>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Trang sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingPet ? "Cập nhật thú cưng" : "Thêm thú cưng mới"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex-1 space-y-5 overflow-y-auto p-6"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Tên thú cưng
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ví dụ: Bông"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Loại thú cưng
                    </label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    >
                      <option value="">-- Chọn loại thú cưng --</option>
                      <option value="dog">Chó</option>
                      <option value="cat">Mèo</option>
                    </select>
                    {fieldErrors.type && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.type}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Giống
                    </label>
                    <input
                      name="breed"
                      value={form.breed}
                      onChange={handleChange}
                      placeholder="Ví dụ: Poodle"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                    {fieldErrors.breed && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.breed}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    >
                      <option value="">-- Chọn giới tính --</option>
                      <option value="unknown">Không rõ</option>
                      <option value="male">Đực</option>
                      <option value="female">Cái</option>
                    </select>
                    {fieldErrors.gender && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.gender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Tuổi
                    </label>
                    <input
                      name="age"
                      type="number"
                      min="0"
                      value={form.age}
                      onChange={handleChange}
                      placeholder="Ví dụ: 2"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                    {fieldErrors.age && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.age}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Cân nặng (kg)
                    </label>
                    <input
                      name="weight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.weight}
                      onChange={handleChange}
                      placeholder="Ví dụ: 4.5"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                    {fieldErrors.weight && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.weight}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Ảnh thú cưng
                  </label>

                  <input
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />

                  {/* Preview image when selecting new file or editing */}
                  {previewImage && (
                    <div className="mt-3">
                      <p className="mb-2 text-sm text-gray-600">
                        Ảnh xem trước:
                      </p>
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-32 w-32 rounded-xl border object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  )}

                  {fieldErrors.image && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.image}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Dị ứng
                  </label>
                  <input
                    name="allergies"
                    value={form.allergies}
                    onChange={handleChange}
                    placeholder="Ví dụ: Không có / Dị ứng hải sản"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                  {fieldErrors.allergies && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.allergies}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Hành vi cần lưu ý
                  </label>
                  <textarea
                    name="behaviorNote"
                    value={form.behaviorNote}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ví dụ: Nhát người lạ, sợ tiếng ồn"
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                  {fieldErrors.behaviorNote && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.behaviorNote}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Ghi chú thêm
                  </label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Thông tin bổ sung cho việc chăm sóc"
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                  {fieldErrors.note && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.note}
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
                  >
                    {submitting
                      ? "Đang lưu..."
                      : editingPet
                      ? "Lưu thay đổi"
                      : "Thêm thú cưng"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
