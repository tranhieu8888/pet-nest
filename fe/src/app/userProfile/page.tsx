'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../utils/axios';
import Header from '@/components/layout/Header';
import { User, Mail, Phone, MapPin, Calendar, Lock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../utils/petPagesConfig.vi';
import enConfig from '../../../utils/petPagesConfig.en';

interface Address {
    _id?: string; // Added _id for potential backend compatibility
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
    address: Address[]; // đổi từ Address thành Address[]
    joinDate?: string;
    birthday?: string;
}

const UserProfilePage = () => {
    const router = useRouter();
    const { lang } = useLanguage();
    const pagesConfig = lang === 'vi' ? viConfig : enConfig;
    const config = pagesConfig.userProfilePage;
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserProfile>({
        name: '',
        email: '',
        phone: '',
        address: [], // đổi từ {} thành []
        joinDate: '',
        birthday: ''
    });
    const [editData, setEditData] = useState<UserProfile | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/myprofile');

                if (response.data.success) {
                    const profileData = response.data.user;
                    let addressArr: Address[] = [];
                    if (Array.isArray(profileData.address)) {
                        addressArr = profileData.address;
                    } else if (typeof profileData.address === 'object' && profileData.address !== null) {
                        addressArr = [profileData.address];
                    }
                    setUserData({
                        name: profileData.name,
                        email: profileData.email,
                        phone: profileData.phone,
                        address: addressArr,
                        joinDate: new Date(profileData.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                            month: 'long',
                            year: 'numeric'
                        }),
                        birthday: profileData.birthday ? new Date(profileData.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
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
    }, [lang]);

    const handleEdit = () => {
        if (!isEditing) {
            setEditData({ ...userData });
        }
        setIsEditing(!isEditing);
    };

    const handleUpdate = async () => {
        if (!editData) return;
        // Kiểm tra các trường bắt buộc
        const errors: { name?: string; email?: string; phone?: string } = {};
        if (!editData.name || !editData.name.trim()) {
            errors.name = 'Vui lòng nhập họ tên!';
        }
        if (!editData.email || !editData.email.trim()) {
            errors.email = 'Vui lòng nhập email!';
        }
        if (!editData.phone || !editData.phone.trim()) {
            errors.phone = 'Vui lòng nhập số điện thoại!';
        }
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        // Kiểm tra ngày sinh hợp lệ
        let dob: string | undefined = undefined;
        if (editData.birthday && !isNaN(new Date(editData.birthday).getTime())) {
            dob = new Date(editData.birthday).toISOString();
        }

        try {
            setLoading(true);
            setError(null);
            const payload: Record<string, unknown> = {
                name: editData.name,
                email: editData.email,
                phone: editData.phone,
                dob: dob,
                address: editData.address
            };
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
            await api.put('/users/edit-profile', payload);
            setUserData(editData);
            setIsEditing(false);
            setEditData(null);
            setSuccessMsg('Cập nhật thông tin thành công!');
        } catch (err) {
            setError('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
            console.error('Error updating profile:', err);
        } finally {
            setLoading(false);
            setFieldErrors({}); // Clear errors on successful update
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
        setFieldErrors({}); // Clear errors on cancel
    };

    const handleChangePassword = () => {
        router.push('/changepass');
    };

    const getValidDateString = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    };

    const handleAddAddress = async () => {
        try {
            const newAddress = { street: '', city: '', state: '', postalCode: '', country: '' };
            const response = await api.post('/users/addresses', newAddress);
            if (response.data.success) {
                setEditData(editData => editData ? { ...editData, address: response.data.data } : null);
                setUserData(userData => ({ ...userData, address: response.data.data }));
                setSuccessMsg('Thêm địa chỉ thành công!');
            }
        } catch (err) {
            setError('Không thể thêm địa chỉ. Vui lòng thử lại sau.');
            console.error('Error adding address:', err);
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        try {
            const response = await api.delete(`/users/addresses/${addressId}`);
            if (response.data.success) {
                setEditData(editData => editData ? { ...editData, address: response.data.data } : null);
                setUserData(userData => ({ ...userData, address: response.data.data }));
                setSuccessMsg('Xóa địa chỉ thành công!');
            }
        } catch (err) {
            setError('Không thể xóa địa chỉ. Vui lòng thử lại sau.');
            console.error('Error deleting address:', err);
        }
    };

    // Tự động ẩn thông báo sau 2.5 giây
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 2500);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-500 text-xl font-medium mb-4">⚠️ {error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        {config.retry}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            {successMsg && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded shadow-lg animate-fade-in">
                    {successMsg}
                </div>
            )}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-white rounded-t-xl shadow-sm p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-10 h-10 text-blue-500" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        { userData.name}
                                    </h1>
                                    <p className="text-gray-500">{config.memberSince.replace('{joinDate}', userData.joinDate || '')}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleChangePassword}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    <span>{config.changePassword}</span>
                                </button>
                                <button
                                    onClick={handleEdit}
                                    className={`px-4 py-2 rounded-lg transition-colors ${isEditing
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                >
                                    {isEditing ? config.cancel : config.edit}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="bg-white rounded-b-xl shadow-sm p-6">
                        <div className="space-y-6">
                            {/* Name Field */}
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <User className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{config.name}</label>
                                    {isEditing ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editData?.name ?? ''}
                                                onChange={e => {
                                                    setEditData(editData => editData ? { ...editData, name: e.target.value } : null);
                                                    setFieldErrors(errors => ({ ...errors, name: undefined }));
                                                }}
                                                className={`w-full px-4 py-2 border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                            />
                                            {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
                                        </>
                                    ) : (
                                        <p className="text-gray-900 text-lg">{userData.name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <Mail className="w-6 h-6 text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{config.email}</label>
                                    <p className="text-gray-900 text-lg">{userData.email}</p>
                                    {isEditing && fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
                                </div>
                            </div>

                            {/* Phone Field */}
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <Phone className="w-6 h-6 text-purple-500" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{config.phone}</label>
                                    {isEditing ? (
                                        <>
                                            <input
                                                type="tel"
                                                value={editData?.phone ?? ''}
                                                onChange={e => {
                                                    setEditData(editData => editData ? { ...editData, phone: e.target.value } : null);
                                                    setFieldErrors(errors => ({ ...errors, phone: undefined }));
                                                }}
                                                className={`w-full px-4 py-2 border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                                            />
                                            {fieldErrors.phone && <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>}
                                        </>
                                    ) : (
                                        <p className="text-gray-900 text-lg">{userData.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Address Field */}
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <MapPin className="w-6 h-6 text-orange-500" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{config.address}</label>
                                    {isEditing ? (
                                        <>
                                            {editData?.address.map((addr, idx) => (
                                                <div key={addr._id || idx} className="mb-4 p-3 border rounded-lg bg-gray-50">
                                                    <div className="mb-2 font-semibold">Địa chỉ {idx + 1}</div>
                                                    <label className="block text-sm text-gray-700">Đường</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Số nhà, đường..."
                                                        value={addr.street ?? ''}
                                                        onChange={e =>
                                                            setEditData(editData =>
                                                                editData
                                                                    ? {
                                                                        ...editData,
                                                                        address: editData.address.map((a, i) =>
                                                                            i === idx ? { ...a, street: e.target.value } : a
                                                                        ),
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-1"
                                                    />
                                                    <label className="block text-sm text-gray-700">Thành phố</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Thành phố"
                                                        value={addr.city ?? ''}
                                                        onChange={e =>
                                                            setEditData(editData =>
                                                                editData
                                                                    ? {
                                                                        ...editData,
                                                                        address: editData.address.map((a, i) =>
                                                                            i === idx ? { ...a, city: e.target.value } : a
                                                                        ),
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-1"
                                                    />
                                                    <label className="block text-sm text-gray-700">Tỉnh/Bang</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Tỉnh/Bang"
                                                        value={addr.state ?? ''}
                                                        onChange={e =>
                                                            setEditData(editData =>
                                                                editData
                                                                    ? {
                                                                        ...editData,
                                                                        address: editData.address.map((a, i) =>
                                                                            i === idx ? { ...a, state: e.target.value } : a
                                                                        ),
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-1"
                                                    />
                                                    <label className="block text-sm text-gray-700">Mã bưu điện</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Mã bưu điện"
                                                        value={addr.postalCode ?? ''}
                                                        onChange={e =>
                                                            setEditData(editData =>
                                                                editData
                                                                    ? {
                                                                        ...editData,
                                                                        address: editData.address.map((a, i) =>
                                                                            i === idx ? { ...a, postalCode: e.target.value } : a
                                                                        ),
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-1"
                                                    />
                                                    <label className="block text-sm text-gray-700">Quốc gia</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Quốc gia"
                                                        value={addr.country ?? ''}
                                                        onChange={e =>
                                                            setEditData(editData =>
                                                                editData
                                                                    ? {
                                                                        ...editData,
                                                                        address: editData.address.map((a, i) =>
                                                                            i === idx ? { ...a, country: e.target.value } : a
                                                                        ),
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                    {/* Nút xóa địa chỉ */}
                                                    {editData.address.length > 1 && addr._id && (
                                                        <button
                                                            type="button"
                                                            className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                            onClick={() => handleDeleteAddress(addr._id!)}
                                                        >
                                                            Xóa địa chỉ này
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Nút thêm địa chỉ mới */}
                                            <button
                                                type="button"
                                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                                onClick={handleAddAddress}
                                            >
                                                Thêm địa chỉ mới
                                            </button>
                                        </>
                                    ) : (
                                        userData.address && userData.address.length > 0 ? (
                                            <ul className="space-y-2">
                                                {userData.address.map((addr, idx) => (
                                                    <li key={addr._id || idx} className="text-gray-900 text-lg">
                                                        <span className="mr-2">-</span>
                                                        {[addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ')}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500">Chưa cập nhật địa chỉ</p>
                                        )
                                    )}
                                </div>
                            </div>
                            {/* Birthday Field */}
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-yellow-50 rounded-lg">
                                    <Calendar className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                                    <input
                                        type="date"
                                        value={isEditing ? getValidDateString(editData?.birthday ?? '') : getValidDateString(userData.birthday)}
                                        onChange={e => isEditing && setEditData(editData => editData ? { ...editData, birthday: e.target.value } : null)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                            {/* Join Date Field */}
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-pink-50 rounded-lg">
                                    <Calendar className="w-6 h-6 text-pink-500" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{config.joinDate}</label>
                                    <p className="text-gray-900 text-lg">{userData.joinDate}</p>
                                </div>
                            </div>


                        </div>

                        {isEditing && (
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={handleUpdate}
                                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg"
                                >
                                    {config.save}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium text-lg"
                                >
                                    Hủy
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserProfilePage;