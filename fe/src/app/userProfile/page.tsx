'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { api } from '../../../utils/axios';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  ShieldCheck,
  Save,
  X,
  PencilLine,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../utils/petPagesConfig.vi';
import enConfig from '../../../utils/petPagesConfig.en';

interface Address {
  _id?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: Address[];
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
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: 'Chưa nhập', color: 'bg-slate-200' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;

  if (score <= 2) return { score, label: 'Yếu', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Trung bình', color: 'bg-amber-500' };
  return { score, label: 'Mạnh', color: 'bg-emerald-500' };
};

type ProvinceApiItem = {
  name: string;
  districts?: { name: string }[];
};

type AddressDatasetItem = {
  province: string;
  districts: { name: string; postalCodes: string[] }[];
};

const VN_POSTAL_CODE_BY_PROVINCE: Record<string, string[]> = {
  'Hà Nội': ['100000'],
  'TP. Hồ Chí Minh': ['700000'],
  'Hải Phòng': ['180000'],
  'Đà Nẵng': ['550000'],
  'Cần Thơ': ['900000'],
  'An Giang': ['880000'],
  'Bà Rịa - Vũng Tàu': ['790000'],
  'Bắc Giang': ['220000'],
  'Bắc Kạn': ['260000'],
  'Bạc Liêu': ['960000'],
  'Bắc Ninh': ['160000'],
  'Bến Tre': ['930000'],
  'Bình Định': ['590000'],
  'Bình Dương': ['820000'],
  'Bình Phước': ['830000'],
  'Bình Thuận': ['770000'],
  'Cà Mau': ['970000'],
  'Cao Bằng': ['270000'],
  'Đắk Lắk': ['630000'],
  'Đắk Nông': ['640000'],
  'Điện Biên': ['320000'],
  'Đồng Nai': ['810000'],
  'Đồng Tháp': ['870000'],
  'Gia Lai': ['610000'],
  'Hà Giang': ['200000'],
  'Hà Nam': ['180000'],
  'Hà Tĩnh': ['480000'],
  'Hải Dương': ['170000'],
  'Hậu Giang': ['950000'],
  'Hòa Bình': ['350000'],
  'Hưng Yên': ['160000'],
  'Khánh Hòa': ['650000'],
  'Kiên Giang': ['920000'],
  'Kon Tum': ['600000'],
  'Lai Châu': ['300000'],
  'Lâm Đồng': ['660000'],
  'Lạng Sơn': ['250000'],
  'Lào Cai': ['310000'],
  'Long An': ['850000'],
  'Nam Định': ['070000'],
  'Nghệ An': ['460000'],
  'Ninh Bình': ['430000'],
  'Ninh Thuận': ['660000'],
  'Phú Thọ': ['290000'],
  'Phú Yên': ['620000'],
  'Quảng Bình': ['510000'],
  'Quảng Nam': ['560000'],
  'Quảng Ngãi': ['570000'],
  'Quảng Ninh': ['200000'],
  'Quảng Trị': ['520000'],
  'Sóc Trăng': ['960000'],
  'Sơn La': ['360000'],
  'Tây Ninh': ['800000'],
  'Thái Bình': ['060000'],
  'Thái Nguyên': ['240000'],
  'Thanh Hóa': ['440000'],
  'Thừa Thiên Huế': ['530000'],
  'Tiền Giang': ['860000'],
  'Trà Vinh': ['940000'],
  'Tuyên Quang': ['300000'],
  'Vĩnh Long': ['890000'],
  'Vĩnh Phúc': ['280000'],
  'Yên Bái': ['330000'],
};

const normalizeProvinceName = (name: string) =>
  name
    .replace(/^Tỉnh\s+/i, '')
    .replace(/^Thành phố\s+/i, '')
    .replace(/^TP\.\s*/i, '')
    .trim();

const getPostalCodesByProvince = (provinceName: string) => {
  if (!provinceName) return [];
  const normalized = normalizeProvinceName(provinceName);

  const exactKey = Object.keys(VN_POSTAL_CODE_BY_PROVINCE).find(
    (key) => normalizeProvinceName(key).toLowerCase() === normalized.toLowerCase(),
  );

  if (exactKey) return VN_POSTAL_CODE_BY_PROVINCE[exactKey];
  return ['000000'];
};

const FALLBACK_VN_ADDRESS_DATA: AddressDatasetItem[] = [
  {
    province: 'Hà Nội',
    districts: [
      { name: 'Ba Đình', postalCodes: ['11100'] },
      { name: 'Hoàn Kiếm', postalCodes: ['11000'] },
      { name: 'Cầu Giấy', postalCodes: ['11300'] },
      { name: 'Đống Đa', postalCodes: ['11500'] },
    ],
  },
  {
    province: 'TP. Hồ Chí Minh',
    districts: [
      { name: 'Quận 1', postalCodes: ['700000'] },
      { name: 'Quận 3', postalCodes: ['724000'] },
      { name: 'Quận Bình Thạnh', postalCodes: ['723000'] },
      { name: 'TP. Thủ Đức', postalCodes: ['713000'] },
    ],
  },
  {
    province: 'Đà Nẵng',
    districts: [
      { name: 'Hải Châu', postalCodes: ['550000'] },
      { name: 'Thanh Khê', postalCodes: ['551000'] },
      { name: 'Sơn Trà', postalCodes: ['552000'] },
      { name: 'Ngũ Hành Sơn', postalCodes: ['557000'] },
    ],
  },
  {
    province: 'Hải Phòng',
    districts: [
      { name: 'Hồng Bàng', postalCodes: ['180000'] },
      { name: 'Ngô Quyền', postalCodes: ['181000'] },
      { name: 'Lê Chân', postalCodes: ['182000'] },
    ],
  },
  {
    province: 'Cần Thơ',
    districts: [
      { name: 'Ninh Kiều', postalCodes: ['940000'] },
      { name: 'Bình Thủy', postalCodes: ['941000'] },
      { name: 'Cái Răng', postalCodes: ['949000'] },
    ],
  },
  {
    province: 'Khánh Hòa',
    districts: [
      { name: 'Nha Trang', postalCodes: ['650000'] },
      { name: 'Cam Ranh', postalCodes: ['655000'] },
    ],
  },
  {
    province: 'Lâm Đồng',
    districts: [
      { name: 'Đà Lạt', postalCodes: ['670000'] },
      { name: 'Bảo Lộc', postalCodes: ['674000'] },
    ],
  },
  {
    province: 'Quảng Ninh',
    districts: [
      { name: 'Hạ Long', postalCodes: ['200000'] },
      { name: 'Cẩm Phả', postalCodes: ['207000'] },
    ],
  },
  {
    province: 'Nghệ An',
    districts: [
      { name: 'Vinh', postalCodes: ['460000'] },
      { name: 'Cửa Lò', postalCodes: ['461000'] },
    ],
  },
  {
    province: 'Thừa Thiên Huế',
    districts: [
      { name: 'Huế', postalCodes: ['530000'] },
      { name: 'Hương Thủy', postalCodes: ['531000'] },
    ],
  },
] as const;

const UserProfilePage = () => {
  const { lang } = useLanguage();
  const pagesConfig = lang === 'vi' ? viConfig : enConfig;
  const config = pagesConfig.userProfilePage;

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
    name: '',
    email: '',
    phone: '',
    address: [],
    joinDate: '',
    birthday: '',
  });

  const [editData, setEditData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/myprofile');

        if (response.data?.success) {
          const profileData = response.data.user;
          const addressArr: Address[] = Array.isArray(profileData.address)
            ? profileData.address
            : profileData.address
              ? [profileData.address]
              : [];

          setUserData({
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            address: addressArr,
            joinDate: profileData.createdAt
              ? new Date(profileData.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : '',
            birthday: profileData.birthday || '',
          });
        }
      } catch (err) {
        setError(config.fetchError);
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [config.fetchError, lang]);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 2500);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const birthdayDisplay = useMemo(() => {
    if (!userData.birthday) return 'Chưa cập nhật';
    const date = new Date(userData.birthday);
    if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
    return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
  }, [userData.birthday, lang]);

  const [vnAddressData, setVnAddressData] = useState<AddressDatasetItem[]>(FALLBACK_VN_ADDRESS_DATA);

  useEffect(() => {
    const fetchVnAddressData = async () => {
      try {
        const response = await fetch('https://provinces.open-api.vn/api/?depth=2');
        if (!response.ok) return;

        const rawData = (await response.json()) as ProvinceApiItem[];
        const normalized: AddressDatasetItem[] = rawData.map((province) => ({
          province: province.name,
          districts: (province.districts || []).map((district) => ({
            name: district.name,
            postalCodes: getPostalCodesByProvince(province.name),
          })),
        }));

        if (normalized.length > 0) {
          setVnAddressData(normalized);
        }
      } catch (apiError) {
        console.error('Cannot load provinces API, using fallback data.', apiError);
      }
    };

    fetchVnAddressData();
  }, []);

  const provinceOptions = useMemo(() => vnAddressData.map((item) => item.province), [vnAddressData]);

  const getDistrictOptions = (province?: string) => {
    const provinceData = vnAddressData.find((item) => item.province === province);
    return provinceData?.districts ?? [];
  };

  const getPostalCodeOptions = (province?: string) => {
    return getPostalCodesByProvince(province || '');
  };

  const getDateInputValue = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
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
    if (!editData.name?.trim()) errors.name = 'Vui lòng nhập họ tên.';
    if (!editData.phone?.trim()) errors.phone = 'Vui lòng nhập số điện thoại.';

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
        address: editData.address,
        dob,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      await api.put('/users/edit-profile', payload);

      setUserData(editData);
      setIsEditing(false);
      setEditData(null);
      setSuccessMsg('Cập nhật thông tin thành công.');
    } catch (err) {
      setError('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
      console.error('Error updating profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = () => {
    const newAddress: Address = {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Vietnam',
    };

    setEditData((prev) => (prev ? { ...prev, address: [...prev.address, newAddress] } : prev));
    setSuccessMsg('Đã thêm form địa chỉ mới. Hãy điền thông tin rồi bấm Lưu thay đổi.');
  };

  const handleDeleteAddress = async (addressId: string, index?: number) => {
    // Nếu là địa chỉ mới tạo ở frontend (chưa có _id) thì chỉ xoá local
    if (!addressId && typeof index === 'number') {
      setEditData((prev) =>
        prev
          ? {
              ...prev,
              address: prev.address.filter((_, idx) => idx !== index),
            }
          : prev,
      );
      return;
    }

    try {
      const response = await api.delete(`/users/addresses/${addressId}`);
      if (response.data?.success) {
        setEditData((prev) => (prev ? { ...prev, address: response.data.data } : prev));
        setUserData((prev) => ({ ...prev, address: response.data.data }));
        setSuccessMsg('Xóa địa chỉ thành công.');
      }
    } catch (err) {
      setError('Không thể xóa địa chỉ. Vui lòng thử lại sau.');
      console.error('Error deleting address:', err);
    }
  };

  const validatePasswordForm = () => {
    const errors: Partial<PasswordForm> = {};

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    }

    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (!passwordPattern.test(passwordForm.newPassword)) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa, 1 số và 1 ký tự đặc biệt.';
    }

    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;

    try {
      setChangingPassword(true);
      setError(null);

      const response = await api.post('/auth/changepassword', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data?.success) {
        setSuccessMsg('Đổi mật khẩu thành công.');
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
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Không thể đổi mật khẩu. Vui lòng thử lại sau.';
      setError(message || 'Không thể đổi mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />

      {successMsg && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-lg">
          {successMsg}
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 py-7 text-white md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold md:text-3xl">{userData.name || 'Tài khoản của bạn'}</h1>
                  <p className="mt-1 text-sm text-slate-200">
                    {config.memberSince.replace('{joinDate}', userData.joinDate || '')}
                  </p>
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
                  {config.changePassword}
                </button>

                <button
                  onClick={handleEditToggle}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isEditing
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <PencilLine className="h-4 w-4" />
                  {isEditing ? config.cancel : config.edit}
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
                      <label className="mb-1 block text-sm font-medium text-slate-600">{config.name}</label>
                      {isEditing ? (
                        <>
                          <input
                            value={editData?.name ?? ''}
                            onChange={(e) => {
                              setEditData((prev) => (prev ? { ...prev, name: e.target.value } : prev));
                              setFieldErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2 ${
                              fieldErrors.name
                                ? 'border-red-400 focus:ring-red-200'
                                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                            }`}
                          />
                          {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
                        </>
                      ) : (
                        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900">
                          {userData.name || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">{config.phone}</label>
                      {isEditing ? (
                        <>
                          <input
                            value={editData?.phone ?? ''}
                            onChange={(e) => {
                              setEditData((prev) => (prev ? { ...prev, phone: e.target.value } : prev));
                              setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                            }}
                            className={`w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2 ${
                              fieldErrors.phone
                                ? 'border-red-400 focus:ring-red-200'
                                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                            }`}
                          />
                          {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
                        </>
                      ) : (
                        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900">
                          {userData.phone || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">{config.email}</label>
                    <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900">{userData.email}</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Ngày sinh</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={getDateInputValue(editData?.birthday)}
                        onChange={(e) => setEditData((prev) => (prev ? { ...prev, birthday: e.target.value } : prev))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    ) : (
                      <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900">{birthdayDisplay}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2 text-slate-800">
                  <MapPin className="h-5 w-5" />
                  <h2 className="font-semibold">{config.address}</h2>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    {(editData?.address || []).map((addr, idx) => (
                      <div key={addr._id || idx} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-2 text-sm font-semibold text-slate-700">Địa chỉ {idx + 1}</p>

                        <div className="grid gap-2 md:grid-cols-2">
                          <input
                            placeholder="Số nhà, đường"
                            value={addr.street ?? ''}
                            onChange={(e) =>
                              setEditData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      address: prev.address.map((a, i) =>
                                        i === idx ? { ...a, street: e.target.value } : a,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                          />
                          <select
                            value={addr.state ?? ''}
                            onChange={(e) => {
                              const selectedProvince = e.target.value;
                              const autoPostalCode = getPostalCodeOptions(selectedProvince)[0] || '';
                              setEditData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      address: prev.address.map((a, i) =>
                                        i === idx
                                          ? {
                                              ...a,
                                              state: selectedProvince,
                                              city: '',
                                              postalCode: autoPostalCode,
                                              country: 'Vietnam',
                                            }
                                          : a,
                                      ),
                                    }
                                  : prev,
                              );
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                          >
                            <option value="">Chọn Tỉnh/Thành phố</option>
                            {provinceOptions.map((province) => (
                              <option key={province} value={province}>
                                {province}
                              </option>
                            ))}
                          </select>

                          <select
                            value={addr.city ?? ''}
                            onChange={(e) => {
                              const selectedDistrict = e.target.value;
                              const postalCodes = getPostalCodeOptions(addr.state);

                              setEditData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      address: prev.address.map((a, i) =>
                                        i === idx
                                          ? {
                                              ...a,
                                              city: selectedDistrict,
                                              postalCode: postalCodes[0] || '',
                                            }
                                          : a,
                                      ),
                                    }
                                  : prev,
                              );
                            }}
                            disabled={!addr.state}
                            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            <option value="">Chọn Quận/Huyện</option>
                            {getDistrictOptions(addr.state).map((district) => (
                              <option key={district.name} value={district.name}>
                                {district.name}
                              </option>
                            ))}
                          </select>

                          <input
                            value={addr.postalCode ?? ''}
                            readOnly
                            placeholder="Mã bưu điện tự động"
                            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-700 outline-none"
                          />
                          <input
                            placeholder="Quốc gia"
                            value={addr.country ?? ''}
                            onChange={(e) =>
                              setEditData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      address: prev.address.map((a, i) =>
                                        i === idx ? { ...a, country: e.target.value } : a,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 md:col-span-2"
                          />
                        </div>

                        {editData && editData.address.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr._id || '', idx)}
                            className="mt-3 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                          >
                            Xóa địa chỉ này
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddAddress}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Thêm địa chỉ mới
                    </button>
                  </div>
                ) : userData.address.length > 0 ? (
                  <ul className="space-y-2">
                    {userData.address.map((addr, idx) => (
                      <li key={addr._id || idx} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800">
                        {[addr.street, addr.city, addr.state, addr.postalCode, addr.country]
                          .filter(Boolean)
                          .join(', ') || 'Chưa cập nhật'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-slate-500">
                    {config.notUpdatedAddress || 'Chưa cập nhật địa chỉ'}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleUpdate}
                    disabled={savingProfile}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? 'Đang lưu...' : config.save}
                  </button>

                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-300"
                  >
                    <X className="h-4 w-4" />
                    {config.cancel}
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
                    <span className="truncate">{userData.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{userData.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>{config.joinDate}: {userData.joinDate || '-'}</span>
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
                          type={passwordVisibility.currentPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }));
                            setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 outline-none focus:border-blue-500"
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
                          type={passwordVisibility.newPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
                            setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 outline-none focus:border-blue-500"
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
                        <p className="mt-1 text-xs text-slate-500">
                          Yêu cầu: ít nhất 8 ký tự, có 1 chữ hoa, 1 số và 1 ký tự đặc biệt.
                        </p>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => {
                            setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                            setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 outline-none focus:border-blue-500"
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
                      {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
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
};

export default UserProfilePage;
