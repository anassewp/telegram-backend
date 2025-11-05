'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  Users,
  Target,
  Star,
  ArrowUp,
  ArrowDown,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    platforms: 0,
    campaigns: 0,
    points: 100,
    subscription: 'مجانية',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);

      // جلب بيانات الملف الشخصي
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setStats(prev => ({
          ...prev,
          points: profileData.points || 100,
        }));
      }

      // جلب عدد المنصات المربوطة
      const { count: platformsCount } = await supabase
        .from('user_platforms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_connected', true);

      // جلب عدد الحملات
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      setStats(prev => ({
        ...prev,
        platforms: platformsCount || 0,
        campaigns: campaignsCount || 0,
      }));
    }
  };

  const statCards = [
    {
      title: 'منصات مربوطة',
      value: stats.platforms,
      change: '+12%',
      positive: true,
      icon: Users,
      color: 'bg-primary-500',
    },
    {
      title: 'حملات نشطة',
      value: stats.campaigns,
      change: '+8%',
      positive: true,
      icon: Target,
      color: 'bg-secondary-500',
    },
    {
      title: 'النقاط',
      value: stats.points,
      change: '+25',
      positive: true,
      icon: Star,
      color: 'bg-accent-500',
    },
    {
      title: 'الاشتراك',
      value: stats.subscription,
      change: 'نشط',
      positive: true,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          مرحباً، {profile?.full_name || 'عزيزي المستخدم'}! 👋
        </h1>
        <p className="text-white/90 text-lg">
          إليك نظرة عامة على نشاطك اليوم
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white p-6 rounded-2xl border border-neutral-200 card-hover"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.positive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span className="font-medium">{stat.change}</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-neutral-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-600">{stat.title}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أداء الحملات */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            أداء الحملات
          </h3>
          <div className="h-64 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p>لا توجد بيانات كافية لعرض الرسم البياني</p>
            </div>
          </div>
        </div>

        {/* النمو */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            النمو الشهري
          </h3>
          <div className="h-64 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <p>ابدأ بإنشاء حملات لرؤية النمو</p>
            </div>
          </div>
        </div>
      </div>

      {/* آخر الأنشطة */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">
          آخر الأنشطة
        </h3>
        <div className="space-y-4">
          {[
            {
              text: 'تم إنشاء حسابك بنجاح',
              time: 'الآن',
              type: 'success',
            },
            {
              text: 'حصلت على 100 نقطة ترحيبية',
              time: 'الآن',
              type: 'points',
            },
          ].map((activity, index) => (
            <div key={index} className="flex items-start gap-4 pb-4 border-b border-neutral-100 last:border-0">
              <div className={`w-2 h-2 mt-2 rounded-full ${
                activity.type === 'success' ? 'bg-green-500' :
                activity.type === 'points' ? 'bg-accent-500' :
                'bg-primary-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-neutral-900">{activity.text}</p>
                <p className="text-sm text-neutral-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* روابط سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/platforms"
          className="bg-gradient-primary p-6 rounded-2xl text-white card-hover group"
        >
          <div className="text-4xl mb-3">🔗</div>
          <h4 className="text-xl font-bold mb-2">ربط منصة</h4>
          <p className="text-white/90 text-sm">ابدأ بربط حساباتك على منصات التواصل</p>
        </a>

        <a
          href="/dashboard/campaigns"
          className="bg-gradient-secondary p-6 rounded-2xl text-white card-hover group"
        >
          <div className="text-4xl mb-3">🎯</div>
          <h4 className="text-xl font-bold mb-2">إنشاء حملة</h4>
          <p className="text-white/90 text-sm">أطلق حملتك التسويقية الأولى</p>
        </a>

        <a
          href="/dashboard/reports"
          className="bg-gradient-rainbow p-6 rounded-2xl text-white card-hover group"
        >
          <div className="text-4xl mb-3">📊</div>
          <h4 className="text-xl font-bold mb-2">عرض التقارير</h4>
          <p className="text-white/90 text-sm">تحليلات مفصلة لأدائك</p>
        </a>
      </div>
    </div>
  );
}
