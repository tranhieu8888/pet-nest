'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CircleAlert, CircleCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { api } from '../../../utils/axios';
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../utils/petPagesConfig.vi';
import enConfig from '../../../utils/petPagesConfig.en';
import { ButtonCore } from '@/components/core/ButtonCore';

interface ErrorResponse {
  success: boolean;
  message: string;
}

function LoginForm() {
  const { lang } = useLanguage();
  const text = (lang === 'vi' ? viConfig : enConfig).authPages.login;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';
  const redirect = searchParams.get('redirect');
  const [showVerifyNotice, setShowVerifyNotice] = useState(registered);

  useEffect(() => {
    const t = setTimeout(() => setIsEntering(true), 20);
    return () => clearTimeout(t);
  }, []);

  const commonErrors = (lang === 'vi' ? viConfig : enConfig).authPages.commonErrors;

  const mapLoginError = (raw?: string) => {
    const message = (raw || '').toLowerCase();
    if (!message) return commonErrors.default;
    if (
      message.includes('email hoặc mật khẩu') ||
      message.includes('invalid') ||
      message.includes('credential') ||
      message.includes('password')
    ) {
      return commonErrors.invalidCredentials;
    }
    if (message.includes('xác minh') || message.includes('verify')) {
      return commonErrors.notVerified;
    }
    if (message.includes('google')) {
      return commonErrors.googleFailed;
    }
    return raw || commonErrors.default;
  };

  const pushWithTransition = (path: string) => {
    setPendingRoute(path);
    setIsLeaving(true);
  };

  useEffect(() => {
    if (!isLeaving || !pendingRoute) return;
    const t = setTimeout(() => router.push(pendingRoute), 220);
    return () => clearTimeout(t);
  }, [isLeaving, pendingRoute, router]);

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
          sessionStorage.removeItem('token');
        } else {
          sessionStorage.setItem('token', token);
          localStorage.removeItem('token');
        }

        try {
          const decoded = jwtDecode<{ role: number }>(token);
          const role = decoded.role;

          const isAdmin = role === 0;
          const isStaff = (role & 2) === 2;
          const isCustomer = (role & 1) === 1;

          if (redirect && isCustomer && !isAdmin && !isStaff) {
            router.push(redirect);
            return;
          }

          if (isAdmin) {
            router.push('/admin/blog');
            return;
          }

          if (isStaff) {
            router.push('/staff/schedule');
            return;
          }

          if (isCustomer) {
            router.push(redirect || '/homepage');
            return;
          }

          router.push(redirect || '/homepage');
        } catch {
          router.push(redirect || '/homepage');
        }
      } else {
        setError(mapLoginError(response.data.message));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ErrorResponse } };

      if (axiosError.response?.data?.message?.includes('chưa được xác minh email')) {
        setShowVerificationModal(true);
      } else {
        setError(mapLoginError(axiosError.response?.data?.message));
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
        setError(lang === 'vi' ? 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.' : 'Verification email was resent. Please check your inbox.');
        setShowVerificationModal(false);
      } else {
        setError(mapLoginError(response.data.message));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ErrorResponse } };
      setError(mapLoginError(axiosError.response?.data?.message));
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError(commonErrors.googleFailed);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      if (response.data.success) {
        const { token } = response.data;

        if (rememberMe) {
          localStorage.setItem('token', token);
          sessionStorage.removeItem('token');
        } else {
          sessionStorage.setItem('token', token);
          localStorage.removeItem('token');
        }

        try {
          const decoded = jwtDecode<{ role: number }>(token);
          const role = decoded.role;

          const isAdmin = role === 0;
          const isStaff = (role & 2) === 2;
          const isCustomer = (role & 1) === 1;

          if (redirect && isCustomer && !isAdmin && !isStaff) {
            router.push(redirect);
            return;
          }

          if (isAdmin) {
            router.push('/admin/blog');
            return;
          }

          if (isStaff) {
            router.push('/staff/schedule');
            return;
          }

          if (isCustomer) {
            router.push(redirect || '/homepage');
            return;
          }

          router.push(redirect || '/homepage');
        } catch {
          router.push(redirect || '/homepage');
        }
      } else {
        setError(mapLoginError(response.data.message));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ErrorResponse } };
      setError(mapLoginError(axiosError.response?.data?.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(commonErrors.googleFailed);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.28), rgba(15,23,42,0.28)), url('/images/pet-bg-auth.jpg')",
        }}
      />

      <div className={`relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-8 px-4 py-8 transition-all duration-500 md:grid-cols-2 md:px-8 ${
        isLeaving
          ? 'translate-y-2 opacity-0'
          : isEntering
            ? 'translate-y-0 opacity-100'
            : 'translate-y-3 opacity-0'
      }`}>
        <div className="hidden text-white md:block">
          <p className="mb-3 inline-flex rounded-full border border-white/30 px-3 py-1 text-xs font-semibold tracking-widest">PET NEST</p>
          <h1 className="text-4xl font-extrabold leading-tight">{text.heroTitle}</h1>
          <p className="mt-3 max-w-md text-slate-200">{text.heroDescription}</p>
        </div>

        <div className="rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">{text.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
          </div>

          {showVerifyNotice && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {text.registerSuccessNotice}
                <button className="ml-2 underline" onClick={() => setShowVerifyNotice(false)} type="button">
                  {text.close}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{text.email}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{text.password}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                {text.rememberMe}
              </label>
              <Link href="/forgetpass" className="font-medium text-pink-600 hover:underline">
                {text.forgotPassword}
              </Link>
            </div>

            <ButtonCore type="submit" isLoading={isLoading} className="w-full">
              {isLoading ? text.loading : text.submit}
            </ButtonCore>

            <ButtonCore
              variantType="outline"
              onClick={() => pushWithTransition('/homepage')}
              className="w-full"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              {text.backHome}
            </ButtonCore>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            {text.orLoginWith}
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_blue" text="signin_with" shape="rectangular" />
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            {text.noAccount}{' '}
            <button
              type="button"
              onClick={() => pushWithTransition('/register')}
              className="font-semibold text-pink-600 hover:underline"
            >
              {text.registerNow}
            </button>
          </p>
        </div>
      </div>

      {showVerificationModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/55 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{text.notVerifiedTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{text.notVerifiedDescription}</p>
             <div className="mt-5 flex gap-2">
              <ButtonCore variantType="outline" onClick={() => setShowVerificationModal(false)} className="w-full">
                {text.close}
              </ButtonCore>
              <ButtonCore onClick={handleResendVerification} isLoading={resendLoading} className="w-full">
                {resendLoading ? text.resending : text.resendEmail}
              </ButtonCore>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
