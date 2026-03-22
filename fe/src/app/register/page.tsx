'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Mail, Phone, Lock, Eye, EyeOff, CircleAlert, CircleCheck } from 'lucide-react';
import { api } from '../../../utils/axios';
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../utils/petPagesConfig.vi';
import enConfig from '../../../utils/petPagesConfig.en';

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
  const { lang } = useLanguage();
  const text = (lang === 'vi' ? viConfig : enConfig).authPages.register;

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setIsEntering(true), 20);
    return () => clearTimeout(t);
  }, []);

  const pushWithTransition = (path: string) => {
    setPendingRoute(path);
    setIsLeaving(true);
  };

  useEffect(() => {
    if (!isLeaving || !pendingRoute) return;
    const t = setTimeout(() => router.push(pendingRoute), 220);
    return () => clearTimeout(t);
  }, [isLeaving, pendingRoute, router]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^0[0-9]{9,10}$/;
    return phoneRegex.test(phone);
  };

  const rules = useMemo(() => {
    const pwd = formData.password;
    return {
      minLength: pwd.length >= 6,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
    };
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError(lang === 'vi' ? 'Mật khẩu xác nhận không khớp' : 'Confirmation password does not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(lang === 'vi' ? 'Mật khẩu phải có ít nhất 6 ký tự' : 'Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setError(lang === 'vi' ? 'Số điện thoại không hợp lệ.' : 'Invalid phone number.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      if (response.data.success) {
        setSuccessMessage(text.success);
        setTimeout(() => {
          pushWithTransition('/login?registered=true');
        }, 1800);
        return;
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: ErrorResponse } };
      const backendMessage = axiosError.response?.data?.message;
      setError(mapRegisterError(backendMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const ruleClass = (ok: boolean) =>
    `rounded-lg border px-2 py-1 text-xs ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`;

  const strengthScore = Number(rules.minLength) + Number(rules.upper) + Number(rules.lower) + Number(rules.number);
  const strengthLabel =
    strengthScore <= 1
      ? text.strengthWeak
      : strengthScore <= 3
        ? text.strengthMedium
        : text.strengthStrong;

  const strengthBarClass =
    strengthScore <= 1
      ? 'bg-rose-500'
      : strengthScore <= 3
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  const mapRegisterError = (raw?: string) => {
    const message = (raw || '').toLowerCase();
    if (!message) return text.errors.default;
    if (message.includes('email') && (message.includes('exist') || message.includes('đã tồn tại') || message.includes('already'))) {
      return text.errors.emailExists;
    }
    if (message.includes('phone') || message.includes('số điện thoại')) {
      return text.errors.invalidPhone;
    }
    if (message.includes('password') && (message.includes('weak') || message.includes('yếu'))) {
      return text.errors.weakPassword;
    }
    return raw || text.errors.default;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="absolute inset-0 -z-10">
        <Image src="/images/background.jpg" alt="Background" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-slate-900/70" />
      </div>

      <div className={`mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-8 px-4 py-8 transition-all duration-500 md:grid-cols-2 md:px-8 ${
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

          {successMessage && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">{text.fullName}</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={lang === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{text.email}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{text.phone}</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0123456789"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{text.password}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">{text.passwordRuleTitle}</p>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${strengthScore <= 1 ? 'bg-rose-50 text-rose-700' : strengthScore <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {strengthLabel}
                  </span>
                </div>
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${strengthBarClass}`}
                    style={{ width: `${Math.max(10, (strengthScore / 4) * 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={ruleClass(rules.minLength)}>{text.ruleMinLength}</div>
                  <div className={ruleClass(rules.upper)}>{text.ruleUpper}</div>
                  <div className={ruleClass(rules.lower)}>{text.ruleLower}</div>
                  <div className={ruleClass(rules.number)}>{text.ruleNumber}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{text.confirmPassword}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {isLoading ? text.loading : text.submit}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            {text.hasAccount}{' '}
            <button
              type="button"
              onClick={() => pushWithTransition('/login')}
              className="font-semibold text-pink-600 hover:underline"
            >
              {text.loginNow}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
