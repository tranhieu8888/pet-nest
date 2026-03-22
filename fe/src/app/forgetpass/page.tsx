'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CircleAlert, CircleCheck } from 'lucide-react';
import { api } from '../../../utils/axios';

interface ErrorResponse {
  success: boolean;
  message: string;
}

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', { email });

      if (response.data?.success) {
        setSuccess('Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.');
      } else {
        setError(response.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại sau.');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: ErrorResponse } };
      setError(axiosError.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
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
              Nhập email để nhận hướng dẫn đặt lại mật khẩu.
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

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </button>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại đăng nhập
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
