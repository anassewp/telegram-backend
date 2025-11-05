'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Link2, Unlink, TrendingUp, Users, Eye, Send, ArrowRight } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface UserPlatform {
  platform_id: string;
  is_connected: boolean;
  connected_at: string;
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // جلب المستخدم الحالي
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);

      // جلب جميع المنصات
      const response = await fetch('/data/platforms.json');
      const data = await response.json();
      setPlatforms(data.platforms);

      // جلب منصات المستخدم المربوطة
      const { data: userPlatformsData } = await supabase
        .from('user_platforms')
        .select('*')
        .eq('user_id', user.id);

      setUserPlatforms(userPlatformsData || []);
    }
    setLoading(false);
  };

  const isConnected = (platformId: string) => {
    return userPlatforms.some(up => up.platform_id === platformId && up.is_connected);
  };

  const handleToggleConnection = async (platformId: string, currentlyConnected: boolean) => {
    if (!userId) return;

    if (currentlyConnected) {
      // فصل المنصة
      const { error } = await supabase
        .from('user_platforms')
        .update({ is_connected: false, disconnected_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('platform_id', platformId);

      if (!error) {
        setUserPlatforms(prev =>
          prev.map(up =>
            up.platform_id === platformId ? { ...up, is_connected: false } : up
          )
        );
      }
    } else {
      // ربط المنصة
      const existing = userPlatforms.find(up => up.platform_id === platformId);
      
      if (existing) {
        // تحديث الاتصال الموجود
        const { error } = await supabase
          .from('user_platforms')
          .update({ is_connected: true, connected_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('platform_id', platformId);

        if (!error) {
          setUserPlatforms(prev =>
            prev.map(up =>
              up.platform_id === platformId ? { ...up, is_connected: true } : up
            )
          );
        }
      } else {
        // إنشاء اتصال جديد
        const { data, error } = await supabase
          .from('user_platforms')
          .insert({
            user_id: userId,
            platform_id: platformId,
            is_connected: true,
            connected_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error && data) {
          setUserPlatforms(prev => [...prev, data]);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">جاري تحميل المنصات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          إدارة المنصات
        </h1>
        <p className="text-neutral-600">
          اربط حساباتك على منصات التواصل الاجتماعي وابدأ بإدارتها من مكان واحد
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">
                {userPlatforms.filter(up => up.is_connected).length}
              </div>
              <div className="text-sm text-neutral-600">منصات مربوطة</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">
                {platforms.length}
              </div>
              <div className="text-sm text-neutral-600">منصات متاحة</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">0</div>
              <div className="text-sm text-neutral-600">إجمالي المتابعين</div>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقة تيليجرام المميزة */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 rounded-3xl p-8 shadow-2xl">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                <Send className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">منصة تيليجرام</h2>
                <p className="text-blue-100 text-lg">أدوات احترافية لإدارة حساباتك على تيليجرام</p>
              </div>
            </div>

            <Link 
              href="/dashboard/telegram"
              className="group flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              الدخول إلى تيليجرام
              <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* الميزات */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white mb-1">6</div>
              <div className="text-sm text-blue-100">أدوات متقدمة</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white mb-1">حسابات متعددة</div>
              <div className="text-sm text-blue-100">إدارة مركزية</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white mb-1">استخراج تلقائي</div>
              <div className="text-sm text-blue-100">مجموعات وأعضاء</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white mb-1">حملات ذكية</div>
              <div className="text-sm text-blue-100">تسويق فعّال</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const connected = isConnected(platform.id);
          
          return (
            <div
              key={platform.id}
              className="bg-white p-6 rounded-2xl border-2 border-neutral-200 hover:border-primary-500 transition-all card-hover"
              style={{
                borderColor: connected ? platform.color : undefined,
              }}
            >
              {/* Platform Icon & Name */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14">
                    <Image
                      src={platform.icon}
                      alt={platform.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">
                      {platform.name}
                    </h3>
                    {connected && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        مربوط
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                {platform.description}
              </p>

              {/* Stats (if connected) */}
              {connected && (
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-neutral-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">0</div>
                    <div className="text-xs text-neutral-600">متابعين</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">0</div>
                    <div className="text-xs text-neutral-600">منشورات</div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => handleToggleConnection(platform.id, connected)}
                className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  connected
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
                style={{
                  backgroundColor: connected ? undefined : platform.color,
                }}
              >
                {connected ? (
                  <>
                    <Unlink className="w-4 h-4" />
                    فصل
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    ربط
                  </>
                )}
              </button>

              {/* View Details (if connected) */}
              {connected && (
                <button className="w-full mt-2 py-2 text-sm text-neutral-600 hover:text-primary-600 flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  عرض التفاصيل
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
