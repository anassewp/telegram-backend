'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Building, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    company: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setFormData(prev => ({ ...prev, email: user.email || '' }));

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          company: profileData.company || '',
          email: user.email || '',
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          company: formData.company,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'تم حفظ التعديلات بنجاح' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          الإعدادات
        </h1>
        <p className="text-neutral-600">
          إدارة معلومات حسابك وتفضيلاتك
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </p>
        </div>
      )}

      {/* الملف الشخصي */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          الملف الشخصي
        </h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              الاسم الكامل
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full pr-12 pl-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="أحمد محمد"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                className="w-full pr-12 pl-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 cursor-not-allowed outline-none"
                disabled
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              لا يمكن تعديل البريد الإلكتروني
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              اسم الشركة (اختياري)
            </label>
            <div className="relative">
              <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full pr-12 pl-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="شركتي للتسويق"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold btn-transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>

      {/* الاشتراك والنقاط */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          الاشتراك والنقاط
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div>
              <div className="font-semibold text-neutral-900">الخطة الحالية</div>
              <div className="text-sm text-neutral-600">
                {profile?.subscription_plan || 'مجانية'}
              </div>
            </div>
            <a
              href="/pricing"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              ترقية الخطة
            </a>
          </div>

          <div className="flex items-center justify-between p-4 bg-accent-50 rounded-lg">
            <div>
              <div className="font-semibold text-neutral-900">النقاط المتاحة</div>
              <div className="text-sm text-neutral-600">
                يمكنك استخدامها للحصول على ميزات إضافية
              </div>
            </div>
            <div className="text-3xl font-bold text-accent-600">
              {profile?.points || 100}
            </div>
          </div>
        </div>
      </div>

      {/* مفاتيح API */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          مفاتيح API
        </h2>
        <p className="text-neutral-600 mb-6">
          قم بإنشاء مفاتيح API للتكامل مع التطبيقات الخارجية
        </p>

        <button className="px-6 py-3 bg-neutral-900 text-white rounded-lg font-semibold btn-transition hover:bg-neutral-800">
          إنشاء مفتاح API جديد
        </button>

        <div className="mt-6 p-4 bg-neutral-50 rounded-lg text-center text-neutral-500">
          لا توجد مفاتيح API حالياً
        </div>
      </div>
    </div>
  );
}
