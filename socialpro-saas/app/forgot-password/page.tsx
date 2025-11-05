'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            تم إرسال الرابط بنجاح!
          </h2>
          <p className="text-neutral-600 mb-6">
            تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowRight className="w-5 h-5" />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-3 space-x-reverse mb-8">
          <Image 
            src="/logo.png" 
            alt="SocialPro Logo" 
            width={48} 
            height={48} 
            className="object-contain"
          />
          <span className="text-3xl font-bold text-neutral-900">SocialPro</span>
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            نسيت كلمة المرور؟
          </h1>
          <p className="text-neutral-600">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-primary text-white rounded-lg font-semibold btn-transition hover:shadow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowRight className="w-5 h-5" />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
