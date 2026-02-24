'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../utils/axios';
import Image from 'next/image';
import styles from './RegisterPage.module.css';

interface ErrorResponse {
    success: boolean;
    message: string;
}

interface FormData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

export default function RegisterPage() {
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();

    const validatePhoneNumber = (phone: string): boolean => {
        const phoneRegex = /^0[0-9]{9,10}$/;
        return phoneRegex.test(phone);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            setIsLoading(false);
            return;
        }

        if (!validatePhoneNumber(formData.phone)) {
            setError('Số điện thoại không hợp lệ.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/register', {
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone
            });

            if (response.data.success) {
                setSuccessMessage('Đăng ký thành công! Vui lòng xác minh email để đăng nhập. Đang chuyển hướng đến trang đăng nhập...');
                setTimeout(() => {
                    router.push('/login?registered=true');
                }, 2000);
                return;
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: ErrorResponse } };
            setError(axiosError.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone' && !/^\d*$/.test(value)) return;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={styles.container}>
            {/* Left side - Pet Image */}
            <div className={styles.left + ' relative'}>
                <Image
                    src="/images/background.jpg"
                    alt="Background"
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                    priority
                />
            </div>

            {/* Right side - Register Form */}
            <div className={styles.right}>
                <div className={styles.formBox}>
                    <div className="text-center">
                        <h2 className={styles.title}>Tạo tài khoản mới</h2>
                    </div>

                    {successMessage && (
                        <div className={styles.success}>{successMessage}</div>
                    )}

                    <form style={{ marginTop: '2rem' }} onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div>
                                <label htmlFor="fullName" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4A5568' }}>
                                    Họ và tên
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4A5568' }}>
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4A5568' }}>
                                    Số điện thoại
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="0123456789"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4A5568' }}>
                                    Mật khẩu
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4A5568' }}>
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.25rem' }}>
                            <button type="submit" disabled={isLoading} className={styles.button}>
                                {isLoading ? (
                                    <div style={{
                                        width: '1.25rem', height: '1.25rem', border: '2px solid #4A5568',
                                        borderTopColor: 'transparent', borderRadius: '50%',
                                        animation: 'spin 1s linear infinite', margin: '0 auto'
                                    }} />
                                ) : (
                                    'Đăng ký'
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className={styles.error}>{error}</div>
                        )}

                        <div style={{ textAlign: 'center' }}>
                            <Link href="/login" className={styles.link} style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Đã có tài khoản? Đăng nhập ngay
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
