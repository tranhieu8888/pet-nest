'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, Lock, Eye, EyeOff, CircleAlert, CircleCheck } from 'lucide-react';
import { api } from '../../../utils/axios';

interface ErrorResponse {
  success?: boolean;
  message?: string;
}

export default function ForgetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const rules = useMemo(() => {
    const pwd = newPassword;
    return {
      minLength: pwd.length >= 6,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
    };
  }, [newPassword]);

  const ruleClass = (ok: boolean) =>
    `rounded-lg border px-2 py-1 text-xs ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`;

  const strengthScore = Number(rules.minLength) + Number(rules.upper) + Number(rules.lower) + Number(rules.number);
  const strengthLabel = strengthScore <= 1 ? 'Yếu' : strengthScore <= 3 ? 'Trung bình' : 'Mạnh';

  const strengthBarClass =
    strengthScore <= 1 ? 'bg-rose-500' : strengthScore <= 3 ? 'bg-amber-500' : 'bg-emerald-500';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingOtp(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/send-otp', { email });
      if (response.data?.success) {
        setOtpSent(true);
        setSuccess(response.data?.message || 'Đã gửi mã OTP qua email.');
      } else {
        setError(response.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: ErrorResponse } };
      setError(axiosError.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    setError('');
    setSuccess('');

    if (!rules.minLength || !rules.upper || !rules.lower || !rules.number) {
      setError('Mật khẩu cần có tối thiểu 6 ký tự, gồm chữ hoa, chữ thường và số.');
      setIsResetting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      setIsResetting(false);
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });

      if (response.data?.success) {
        setSuccess(response.data?.message || 'Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập...');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          router.push('/login');
        }, 1200);
      } else {
        setError(response.data?.message || 'Đặt lại mật khẩu thất bại.');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: ErrorResponse } };
      setError(axiosError.response?.data?.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setIsResetting(false);
    }
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

      <div className="relative z-10 mx-auto grid min-h-screen max-w-md items-center px-4 py-8">
        <div className="rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h1>
            <p className="mt-1 text-sm text-slate-500">
              {!otpSent
                ? 'Nhập email để nhận mã OTP đặt lại mật khẩu.'
                : 'Nhập OTP và mật khẩu mới để hoàn tất.'}
            </p>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full rounded-xl bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isSendingOtp ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mã OTP</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhập mã OTP từ email"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự, có chữ hoa/chữ thường/số"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">Mật khẩu nên có:</p>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${strengthScore <= 1 ? 'bg-rose-50 text-rose-700' : strengthScore <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
                    >
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
                    <div className={ruleClass(rules.minLength)}>Tối thiểu 6 ký tự</div>
                    <div className={ruleClass(rules.upper)}>Ít nhất 1 chữ hoa</div>
                    <div className={ruleClass(rules.lower)}>Ít nhất 1 chữ thường</div>
                    <div className={ruleClass(rules.number)}>Ít nhất 1 chữ số</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Gửi lại OTP
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full rounded-xl bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {isResetting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          )}

          <Link
            href="/login"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
