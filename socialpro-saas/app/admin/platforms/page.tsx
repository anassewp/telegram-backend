'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Share2, Edit, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import Image from 'next/image';

interface Platform {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  color: string;
  icon: string;
  is_active: boolean;
  requires_premium: boolean;
  description: string;
  sort_order: number;
  user_count?: number;
}

export default function AdminPlatformsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    checkAdminAccess();
    loadPlatforms();
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

  const loadPlatforms = async () => {
    try {
      // تحميل بيانات المنصات من الملف JSON
      const response = await fetch('/data/platforms.json');
      const data = await response.json();
      
      if (data.platforms) {
        // حساب عدد المستخدمين لكل منصة
        const platformsWithCounts = await Promise.all(
          data.platforms.map(async (platform: Platform) => {
            const { count } = await supabase
              .from('user_platforms')
              .select('*', { count: 'exact', head: true })
              .eq('platform_id', platform.id);

            return {
              ...platform,
              user_count: count || 0,
            };
          })
        );

        setPlatforms(platformsWithCounts);
      }
    } catch (error) {
      console.error('خطأ في تحميل المنصات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (platformId: string, currentStatus: boolean) => {
    // في التطبيق الحقيقي، سنحفظ هذا في قاعدة البيانات
    // هنا فقط تحديث محلي
    setPlatforms((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, is_active: !currentStatus } : p))
    );
    alert(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} المنصة بنجاح`);
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-8 h-8" />
            إدارة المنصات
          </h1>
          <p className="text-gray-600 mt-1">إدارة منصات التواصل الاجتماعي المتاحة</p>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}15` }}
                  >
                    <div className="relative w-8 h-8">
                      <Image
                        src={platform.icon}
                        alt={platform.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-500">{platform.name_en}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleStatus(platform.id, platform.is_active)}
                  className="flex items-center gap-2"
                >
                  {platform.is_active ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{platform.user_count || 0} مستخدم</span>
                </div>

                <div className="flex items-center gap-2">
                  {platform.is_active ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      نشط
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      معطل
                    </span>
                  )}
                  {platform.requires_premium && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      مميز
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
                  <Edit className="w-4 h-4" />
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ملخص المنصات</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">إجمالي المنصات</p>
              <p className="text-3xl font-bold text-blue-600">{platforms.length}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">المنصات النشطة</p>
              <p className="text-3xl font-bold text-green-600">
                {platforms.filter((p) => p.is_active).length}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">المنصات المعطلة</p>
              <p className="text-3xl font-bold text-gray-600">
                {platforms.filter((p) => !p.is_active).length}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">المنصات المميزة</p>
              <p className="text-3xl font-bold text-purple-600">
                {platforms.filter((p) => p.requires_premium).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
