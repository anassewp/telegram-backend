'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Award,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [platformUsage, setPlatformUsage] = useState<any[]>([]);
  const [subscriptionDist, setSubscriptionDist] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
    loadStats();
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

  const loadStats = async () => {
    try {
      // نمو المستخدمين (آخر 30 يوم)
      const growthData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', `${dateStr}T23:59:59`);

        if (i % 5 === 0 || i < 7) {
          growthData.push({
            date: dateStr,
            users: count || 0,
          });
        }
      }
      setUserGrowth(growthData);

      // توزيع الاشتراكات
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('status', 'active');

      const planCounts: any = { free: 0, monthly: 0, annual: 0, lifetime: 0 };
      subsData?.forEach((sub) => {
        if (planCounts.hasOwnProperty(sub.plan_id)) {
          planCounts[sub.plan_id]++;
        }
      });

      setSubscriptionDist([
        { name: 'مجاني', value: planCounts.free, color: '#9CA3AF' },
        { name: 'شهري', value: planCounts.monthly, color: '#3B82F6' },
        { name: 'سنوي', value: planCounts.annual, color: '#9D4EDD' },
        { name: 'مدى الحياة', value: planCounts.lifetime, color: '#F59E0B' },
      ]);

      // استخدام المنصات (عدد الحملات لكل منصة)
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('platform_id');

      const platformCounts: any = {};
      campaignsData?.forEach((campaign) => {
        platformCounts[campaign.platform_id] = (platformCounts[campaign.platform_id] || 0) + 1;
      });

      const platformStats = Object.entries(platformCounts)
        .map(([platform, count]) => ({
          platform,
          campaigns: count,
        }))
        .sort((a: any, b: any) => b.campaigns - a.campaigns)
        .slice(0, 6);

      setPlatformUsage(platformStats);

      // أكثر المستخدمين نشاطاً (حسب النقاط)
      const { data: topUsersData } = await supabase
        .from('profiles')
        .select('id, full_name, total_points, created_at')
        .order('total_points', { ascending: false })
        .limit(10);

      if (topUsersData) {
        const usersWithEmail = await Promise.all(
          topUsersData.map(async (user) => {
            const { data: authData } = await supabase.auth.admin.getUserById(user.id);
            return {
              ...user,
              email: authData?.user?.email || 'غير متوفر',
            };
          })
        );
        setTopUsers(usersWithEmail);
      }
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#9CA3AF', '#3B82F6', '#9D4EDD', '#F59E0B'];

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
            <BarChart3 className="w-8 h-8" />
            الإحصائيات المتقدمة
          </h1>
          <p className="text-gray-600 mt-1">تحليلات شاملة لأداء المنصة</p>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Growth */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              نمو المستخدمين (آخر 30 يوم)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: any) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#9D4EDD"
                  strokeWidth={3}
                  name="المستخدمين"
                  dot={{ r: 4, fill: '#9D4EDD' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subscription Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              توزيع الاشتراكات
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} (${entry.value})`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Platform Usage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              استخدام المنصات (عدد الحملات)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="campaigns" fill="#3B82F6" name="الحملات" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              أكثر المستخدمين نشاطاً
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || 'غير محدد'}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-primary">{user.total_points}</p>
                    <p className="text-xs text-gray-500">نقطة</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">إحصائيات النقاط</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">إجمالي النقاط الممنوحة</p>
              <p className="text-3xl font-bold text-purple-600">
                {topUsers.reduce((sum, u) => sum + (u.total_points || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">متوسط النقاط لكل مستخدم</p>
              <p className="text-3xl font-bold text-blue-600">
                {topUsers.length > 0
                  ? Math.round(
                      topUsers.reduce((sum, u) => sum + (u.total_points || 0), 0) / topUsers.length
                    )
                  : 0}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">أعلى رصيد نقاط</p>
              <p className="text-3xl font-bold text-green-600">
                {topUsers.length > 0 ? topUsers[0].total_points : 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
