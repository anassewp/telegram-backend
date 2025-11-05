'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Settings, Save } from 'lucide-react';

interface AdminSettings {
  id?: string;
  platform_name: string;
  max_free_campaigns: number;
  default_points: number;
  maintenance_mode: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>({
    platform_name: 'SocialPro',
    max_free_campaigns: 5,
    default_points: 100,
    maintenance_mode: false,
    email_notifications: true,
    sms_notifications: false,
  });

  useEffect(() => {
    checkAdminAccess();
    loadSettings();
  }, []);

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('admin_settings')
          .update(settings)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert([settings]);

        if (error) throw error;
      }

      alert('تم حفظ الإعدادات بنجاح');
      loadSettings();
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            إعدادات المنصة
          </h1>
          <p className="text-gray-600 mt-1">تكوين إعدادات النظام العامة</p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Platform Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المنصة
            </label>
            <input
              type="text"
              value={settings.platform_name}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Max Free Campaigns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحد الأقصى للحملات المجانية
            </label>
            <input
              type="number"
              value={settings.max_free_campaigns}
              onChange={(e) =>
                setSettings({ ...settings, max_free_campaigns: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              عدد الحملات المسموح بها للمستخدمين على الخطة المجانية
            </p>
          </div>

          {/* Default Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              النقاط الافتراضية عند التسجيل
            </label>
            <input
              type="number"
              value={settings.default_points}
              onChange={(e) =>
                setSettings({ ...settings, default_points: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              عدد النقاط الممنوحة للمستخدمين الجدد تلقائياً
            </p>
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <p className="font-medium text-gray-900">وضع الصيانة</p>
              <p className="text-sm text-gray-600">
                عند التفعيل، لن يتمكن المستخدمون من الوصول للمنصة
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenance_mode: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">إشعارات البريد الإلكتروني</p>
              <p className="text-sm text-gray-600">إرسال رسائل بريد إلكتروني للمستخدمين</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) =>
                  setSettings({ ...settings, email_notifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">إشعارات SMS</p>
              <p className="text-sm text-gray-600">إرسال رسائل نصية للمستخدمين</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sms_notifications}
                onChange={(e) =>
                  setSettings({ ...settings, sms_notifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
