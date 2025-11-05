'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { sendVerificationCode, verifyCode, deleteSession as deleteBackendSession } from '@/lib/telegram-api';
import { 
  Plus, 
  Trash2, 
  Phone, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Smartphone,
  Send,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface TelegramSession {
  id: string;
  session_name: string;
  phone: string;
  status: 'pending' | 'active' | 'inactive' | 'error';
  created_at: string;
}

export default function TelegramSessionsPage() {
  const [sessions, setSessions] = useState<TelegramSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    sessionName: '',
    phone: '',
    apiId: '',
    apiHash: '',
    verificationCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (!formData.sessionName || !formData.phone || !formData.apiId || !formData.apiHash) {
      setError('الرجاء ملء جميع الحقول');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await sendVerificationCode(formData.phone, formData.apiId, formData.apiHash);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      setError('الرجاء إدخال رمز التحقق');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      const result = await verifyCode(
        formData.phone,
        formData.apiId,
        formData.apiHash,
        formData.verificationCode
      );

      const { error: insertError } = await supabase
        .from('telegram_sessions')
        .insert({
          user_id: user.id,
          session_name: formData.sessionName,
          phone: formData.phone,
          api_id: formData.apiId,
          api_hash: formData.apiHash,
          session_string: result.session_string,
          status: 'active',
        });

      if (insertError) throw insertError;

      await fetchSessions();
      
      setShowAddModal(false);
      setCurrentStep(1);
      setFormData({
        sessionName: '',
        phone: '',
        apiId: '',
        apiHash: '',
        verificationCode: '',
      });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحقق من الرمز');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return;

    try {
      const { error } = await supabase
        .from('telegram_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      await deleteBackendSession(sessionId);
      await fetchSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('حدث خطأ أثناء حذف الجلسة');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'نشط',
        glow: 'shadow-green-500/50'
      },
      error: {
        bg: 'bg-gradient-to-r from-red-500 to-rose-500',
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'خطأ',
        glow: 'shadow-red-500/50'
      },
      inactive: {
        bg: 'bg-gradient-to-r from-gray-500 to-slate-500',
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'غير نشط',
        glow: 'shadow-gray-500/50'
      },
      pending: {
        bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        icon: <Clock className="w-4 h-4" />,
        text: 'قيد الانتظار',
        glow: 'shadow-yellow-500/50'
      }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium ${config.bg} shadow-lg ${config.glow}`}>
        {config.icon}
        {config.text}
      </div>
    );
  };

  return (
    <div className="space-y-6" style={{animation: 'fade-in 0.3s ease-out'}}>
      {/* Back Button */}
      <Link 
        href="/dashboard/telegram"
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-2"
      >
        <ArrowRight className="w-5 h-5" />
        <span className="font-medium">العودة لقسم التيليجرام</span>
      </Link>

      {/* Header with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              جلسات تيليجرام
            </h1>
            <p className="text-white/90 text-lg">إدارة حسابات تيليجرام المتصلة بذكاء وأمان</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="group flex items-center gap-2 px-6 py-4 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-bold"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            إضافة جلسة جديدة
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-neutral-600 font-medium">جاري تحميل الجلسات...</p>
        </div>
      ) : sessions.length === 0 ? (
        // Enhanced Empty State
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-16 border-2 border-dashed border-purple-200">
          <div className="text-center relative z-10">
            {/* Animated Icon */}
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-6 shadow-2xl animate-pulse">
              <Phone className="w-16 h-16 text-white" />
            </div>
            
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              لا توجد جلسات حتى الآن
            </h3>
            <p className="text-neutral-600 text-lg mb-8 max-w-md mx-auto">
              ابدأ رحلتك مع تيليجرام بإضافة جلسة جديدة واستمتع بميزات التسويق الذكي
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-700">آمن ومحمي</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-700">سريع وفعال</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <Send className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-700">تواصل ذكي</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 font-bold text-lg"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              إضافة جلسة الآن
            </button>
          </div>

          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session, index) => (
            <div
              key={session.id}
              className="group relative bg-white rounded-2xl p-6 border-2 border-neutral-100 hover:border-purple-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ animation: `slide-up 0.4s ease-out ${index * 100}ms` }}
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-lg">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900">
                        {session.session_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600 bg-neutral-50 px-3 py-2 rounded-lg">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{session.phone}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 group/btn"
                  >
                    <Trash2 className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(session.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-2 rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>تم الإنشاء في {new Date(session.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{animation: 'fade-in 0.3s ease-out'}}>
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden" style={{animation: 'slide-up 0.4s ease-out'}}>
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100">
              <div 
                className={`h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300 ${currentStep === 1 ? 'w-1/2' : 'w-full'}`}
              ></div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowAddModal(false);
                setCurrentStep(1);
                setFormData({
                  sessionName: '',
                  phone: '',
                  apiId: '',
                  apiHash: '',
                  verificationCode: '',
                });
                setError('');
              }}
              className="absolute left-6 top-6 p-2 hover:bg-neutral-100 rounded-xl transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-12">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4 shadow-lg">
                  {currentStep === 1 ? (
                    <Smartphone className="w-8 h-8 text-white" />
                  ) : (
                    <Shield className="w-8 h-8 text-white" />
                  )}
                </div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                  {currentStep === 1 ? 'إضافة جلسة جديدة' : 'رمز التحقق'}
                </h2>
                <p className="text-neutral-600">
                  {currentStep === 1 
                    ? 'أدخل بيانات حساب تيليجرام الخاص بك' 
                    : 'أدخل رمز التحقق المرسل إلى تيليجرام'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3" style={{animation: 'shake 0.5s ease-out'}}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Credentials */}
              {currentStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                      اسم الجلسة
                    </label>
                    <input
                      type="text"
                      value={formData.sessionName}
                      onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
                      placeholder="مثال: حساب العمل"
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+966xxxxxxxxx"
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">
                        API ID
                      </label>
                      <input
                        type="text"
                        value={formData.apiId}
                        onChange={(e) => setFormData({ ...formData, apiId: e.target.value })}
                        placeholder="12345"
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">
                        API Hash
                      </label>
                      <input
                        type="text"
                        value={formData.apiHash}
                        onChange={(e) => setFormData({ ...formData, apiHash: e.target.value })}
                        placeholder="abc123..."
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
                    <p className="text-xs text-neutral-600">
                      💡 احصل على API ID و API Hash من <a href="https://my.telegram.org/apps" target="_blank" className="text-purple-600 font-bold hover:underline">my.telegram.org/apps</a>
                    </p>
                  </div>

                  <button
                    onClick={handleNextStep}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        التالي
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // Step 2: Verification Code
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2 text-center">
                      رمز التحقق
                    </label>
                    <input
                      type="text"
                      value={formData.verificationCode}
                      onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                      placeholder="• • • • •"
                      className="w-full px-4 py-5 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-center text-3xl tracking-[1em] font-bold transition-all"
                      maxLength={5}
                      autoFocus
                    />
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-neutral-600 text-center">
                      🔐 تحقق من تطبيق تيليجرام للحصول على الرمز
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setError('');
                      }}
                      className="flex-1 py-4 border-2 border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-bold"
                    >
                      رجوع
                    </button>
                    <button
                      onClick={handleVerifyCode}
                      disabled={submitting}
                      className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          جاري التحقق...
                        </>
                      ) : (
                        <>
                          تحقق
                          <CheckCircle className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
