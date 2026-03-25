"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../../utils/axios";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  ShieldCheck,
  Save,
  X,
  PencilLine,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  joinDate?: string;
  birthday?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordVisibility {
  currentPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
}

const defaultPasswordForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "Chưa nhập", color: "bg-slate-200" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;

  if (score <= 2) return { score, label: "Yếu", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Trung bình", color: "bg-amber-500" };
  return { score, label: "Mạnh", color: "bg-emerald-500" };
};

export default function StaffProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordForm>>({});

  const [passwordForm, setPasswordForm] = useState<PasswordForm>(defaultPasswordForm);
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [userData, setUserData] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    joinDate: "",
    birthday: "",
  });

  const [editData, setEditData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/myprofile");

        if (response.data?.success) {
          const profileData = response.data.user;
          setUserData({
            name: profileData.name || "",
            email: profileData.email || "",
            phone: profileData.phone || "",
            joinDate: profileData.createdAt
              ? new Date(profileData.createdAt).toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })
              : "",
            birthday: profileData.birthday || "",
          });
        }
      } catch {
        setError("Không thể tải hồ sơ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 2500);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const birthdayDisplay = useMemo(() => {
    if (!userData.birthday) return "Chưa cập nhật";
    const date = new Date(userData.birthday);
    if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
    return date.toLocaleDateString("vi-VN");
  }, [userData.birthday]);

  const getDateInputValue = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({ ...userData });
    } else {
      setEditData(null);
      setFieldErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setFieldErrors({});
  };

  const handleUpdate = async () => {
    if (!editData) return;

    const errors: { name?: string; phone?: string } = {};
    if (!editData.name?.trim()) errors.name = "Vui lòng nhập họ tên.";
    if (!editData.phone?.trim()) errors.phone = "Vui lòng nhập số điện thoại.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    let dob: string | undefined;
    if (editData.birthday) {
      const parsed = new Date(editData.birthday);
      if (!Number.isNaN(parsed.getTime())) {
        dob = parsed.toISOString();
      }
    }

    try {
      setSavingProfile(true);
      setError(null);

      const payload: Record<string, unknown> = {
        name: editData.name.trim(),
        email: editData.email,
        phone: editData.phone.trim(),
        dob,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      await api.put("/users/edit-profile", payload);

      setUserData(editData);
      setIsEditing(false);
      setEditData(null);
      setSuccessMsg("Cập nhật thông tin thành công.");
    } catch {
      setError("Không thể cập nhật thông tin. Vui lòng thử lại sau.");
    } finally {
      setSavingProfile(false);
    }
  };

  const validatePasswordForm = () => {
    const errors: Partial<PasswordForm> = {};

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    }

    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (!passwordPattern.test(passwordForm.newPassword)) {
      errors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa, 1 số và 1 ký tự đặc biệt.";
    }

    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;

    try {
      setChangingPassword(true);
      setError(null);

      const response = await api.post("/auth/changepassword", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data?.success) {
        setSuccessMsg("Đổi mật khẩu thành công.");
        setPasswordForm(defaultPasswordForm);
        setPasswordErrors({});
        setPasswordVisibility({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false,
        });
        setIsPasswordPanelOpen(false);
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Không thể đổi mật khẩu. Vui lòng thử lại sau.";
      setError(message || "Không thể đổi mật khẩu. Vui lòng thử lại sau.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 rounded-xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl">
      {successMsg && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-lg">
          {successMsg}
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-6 py-7 text-white md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold md:text-3xl">{userData.name || "Tài khoản của bạn"}</h1>
                  <p className="mt-1 text-sm text-emerald-100">Thành viên từ {userData.joinDate || "-"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setIsPasswordPanelOpen((prev) => !prev);
                    setPasswordErrors({});
                    setPasswordVisibility({
                      currentPassword: false,
                      newPassword: false,
                      confirmPassword: false,
                    });
                    setError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  <Lock className="h-4 w-4" />
                  Thay đổi mật khẩu
                </button>

                <button
                  onClick={handleEditToggle}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isEditing ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-teal-500 text-white hover:bg-teal-600"
                  }`}
                >
                  <PencilLine className="h-4 w-4" />
                  {isEditing ? "Hủy" : "Chỉnh sửa"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
            <div className="space-y-4 md:col-span-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2 text-slate-800">
                  <ShieldCheck className="h-5 w-5" />
                  <h2 className="font-semibold">Thông tin cá nhân</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">Họ và tên</label>
                      {isEditing ? (
                        <>
                          <input
                            value={editData?.name ?? ""}
                            onChange={(e) => {
                              setEditData((prev) => (prev ? { ...prev, name: e.target.value } : prev));
                              setFieldErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2 ${
                              fieldErrors.name
                                ? "border-red-400 focus:ring-red-200"
                                : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                            }`}
                          />
                          {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
                        </>
                      ) : (
                        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900">
                          {userData.name || "Chưa cập nhật"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">Số điện thoại</label>
                      {isEditing ? (
                        <>
                          <input
                            value={editData?.phone ?? ""}
                            onChange={(e) => {
                              setEditData((prev) => (prev ? { ...prev, phone: e.target.value } : prev));
                              setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                            }}
                            className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2 ${
                              fieldErrors.phone
                                ? "border-red-400 focus:ring-red-200"
                                : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                            }`}
                          />
                          {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
                        </>
                      ) : (
                        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900">
                          {userData.phone || "Chưa cập nhật"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
                    <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900">{userData.email}</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Ngày sinh</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={getDateInputValue(editData?.birthday)}
                        onChange={(e) => setEditData((prev) => (prev ? { ...prev, birthday: e.target.value } : prev))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    ) : (
                      <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900">{birthdayDisplay}</p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleUpdate}
                    disabled={savingProfile}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>

                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-300"
                  >
                    <X className="h-4 w-4" />
                    Hủy
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 font-semibold text-slate-800">Tổng quan tài khoản</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{userData.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{userData.phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>Ngày tham gia: {userData.joinDate || "-"}</span>
                  </div>
                </div>
              </div>

              {isPasswordPanelOpen && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-4 font-semibold text-slate-800">Đổi mật khẩu</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.currentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }));
                            setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPasswordVisibility((prev) => ({
                              ...prev,
                              currentPassword: !prev.currentPassword,
                            }))
                          }
                          className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700"
                        >
                          {passwordVisibility.currentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">Mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.newPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
                            setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPasswordVisibility((prev) => ({
                              ...prev,
                              newPassword: !prev.newPassword,
                            }))
                          }
                          className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700"
                        >
                          {passwordVisibility.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                          <span>Độ mạnh mật khẩu</span>
                          <span className="font-medium">{getPasswordStrength(passwordForm.newPassword).label}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div
                            className={`h-2 rounded-full transition-all ${getPasswordStrength(passwordForm.newPassword).color}`}
                            style={{ width: `${Math.max(8, getPasswordStrength(passwordForm.newPassword).score * 20)}%` }}
                          />
                        </div>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.confirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                            setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPasswordVisibility((prev) => ({
                              ...prev,
                              confirmPassword: !prev.confirmPassword,
                            }))
                          }
                          className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700"
                        >
                          {passwordVisibility.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>

                    <button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {changingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
