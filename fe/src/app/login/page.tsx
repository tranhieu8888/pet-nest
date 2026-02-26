'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../utils/axios';
import Image from 'next/image';
import styles from './LoginPage.module.css';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface ErrorResponse {
    success: boolean;
    message: string;
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered') === 'true';
    const [showVerifyNotice, setShowVerifyNotice] = useState(registered);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data.success) {
                const { token } = response.data;

                if (rememberMe) {
                    localStorage.setItem('token', token);
                } else {
                    sessionStorage.setItem('token', token);
                }

                try {
                    const decoded = jwtDecode<{ role: number }>(token);
                    const role = decoded.role;
                    switch (role) {
                        case 0:
                            router.push('/admin/blog');
                            break;
                        case 2:
                            router.push('/staff/dashboard');
                            break;
                        case 1:
                        default:
                            router.push('/homepage');
                            break;
                    }
                } catch {
                    router.push('/homepage');
                }
            } else {
                setError(response.data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: ErrorResponse } };
            if (axiosError.response?.data?.message?.includes('chưa được xác minh email')) {
                setShowVerificationModal(true);
            } else {
                setError(axiosError.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            setResendLoading(true);
            const response = await api.post('/auth/resend-verification', { email });
            if (response.data.success) {
                setError('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.');
                setShowVerificationModal(false);
            } else {
                setError(response.data.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.');
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: ErrorResponse } };
            setError(axiosError.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau');
        } finally {
            setResendLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
        if (!credentialResponse.credential) {
            setError('Không thể xác thực với Google. Vui lòng thử lại.');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const response = await api.post('/auth/google', {
                credential: credentialResponse.credential
            });

            if (response.data.success) {
                const { token } = response.data;

                if (rememberMe) {
                    localStorage.setItem('token', token);
                } else {
                    sessionStorage.setItem('token', token);
                }

                try {
                    const decoded = jwtDecode<{ role: number }>(token);
                    const role = decoded.role;
                    switch (role) {
                        case 0:
                            router.push('/admin/blog');
                            break;
                        case 2:
                            router.push('/staff/dashboard');
                            break;
                        case 1:
                        default:
                            router.push('/homepage');
                            break;
                    }
                } catch {
                    router.push('/homepage');
                }
            } else {
                setError(response.data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: ErrorResponse } };
            setError(axiosError.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
    };

    return (
        <div className={styles.container}>
            {/* Left side - Pet Image */}
            <div className={styles.left + ' relative'}>
                <Image
                    src="/images/background.jpg"
                    alt="Pet Shop Background"
                    fill
                    priority
                />
            </div>

            {/* Right side - Login Form */}
            <div className={styles.right}>
                <div className={styles.formBox}>
                    <div className="text-center">
                        <h2 className={styles.title}>Chào mừng trở lại!</h2>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                            Đăng nhập để tiếp tục
                        </p>
                    </div>

                    {showVerifyNotice && (
                        <div className={styles.success}>
                            Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản trước khi đăng nhập.
                            <button
                                type="button"
                                style={{ marginLeft: '0.5rem', color: '#2563eb', textDecoration: 'underline', fontSize: '0.875rem' }}
                                onClick={() => setShowVerifyNotice(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    )}

                    <form style={{ marginTop: '2rem' }} onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {error && (
                                <div className={styles.error}>{error}</div>
                            )}
                            <div>
                                <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4A5568' }}>
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={styles.input}
                                    placeholder="your@email.com"
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={styles.input}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                    style={{ height: '1rem', width: '1rem' }}
                                />
                                <label htmlFor="remember-me" style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#4A5568' }}>
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>
                            <div>
                                <a href="/forgetpass" className={styles.link} style={{ fontSize: '0.875rem' }}>
                                    Quên mật khẩu?
                                </a>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <button type="submit" disabled={isLoading} className={styles.button}>
                                {isLoading ? (
                                    <div style={{
                                        width: '1.25rem', height: '1.25rem', border: '2px solid #4A5568',
                                        borderTopColor: 'transparent', borderRadius: '50%',
                                        animation: 'spin 1s linear infinite', margin: '0 auto'
                                    }} />
                                ) : (
                                    'Đăng nhập'
                                )}
                            </button>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Link href="/register" className={styles.link} style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Chưa có tài khoản? Đăng ký ngay
                            </Link>
                        </div>
                    </form>

                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '100%', borderTop: '1px solid #e2e8f0' }} />
                            </div>
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>
                                <span style={{ padding: '0 0.5rem', background: '#fff', color: '#718096' }}>
                                    Hoặc đăng nhập với
                                </span>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                                theme="filled_blue"
                                text="signin_with"
                                shape="rectangular"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Modal */}
            {showVerificationModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <h3 className={styles.modalTitle}>Tài khoản chưa được xác minh</h3>
                        <p className={styles.modalText}>
                            Tài khoản của bạn chưa được xác minh email. Vui lòng kiểm tra hộp thư của bạn để kích hoạt tài khoản.<br />
                            Nếu chưa nhận được email, bạn có thể gửi lại bên dưới.
                        </p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowVerificationModal(false)} className={styles.modalCloseBtn}>
                                Đóng
                            </button>
                            <button onClick={handleResendVerification} disabled={resendLoading} className={styles.modalResendBtn}>
                                {resendLoading ? (
                                    <div style={{
                                        width: '1.25rem', height: '1.25rem', border: '2px solid #fff',
                                        borderTopColor: 'transparent', borderRadius: '50%',
                                        animation: 'spin 1s linear infinite', margin: '0 auto'
                                    }} />
                                ) : (
                                    'Gửi lại email xác thực'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
