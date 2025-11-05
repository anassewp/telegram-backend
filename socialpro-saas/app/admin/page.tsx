'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  CreditCard,
  Coins,
  Target,
  TrendingUp,
  ArrowUp,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  paidSubscriptions: number;
  totalPoints: number;
  totalCampaigns: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  total_points: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    paidSubscriptions: 0,
    totalPoints: 0,
    totalCampaigns: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('Admin Page - No user found, redirecting to login');
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Admin Page - Error fetching profile:', error);
        router.push('/dashboard');
        return;
      }

      console.log('Admin Page - Access check:', {
        userId: user.id,
        role: profile?.role,
        isAdmin: profile?.role === 'admin',
      });

      if (profile?.role !== 'admin') {
        console.log('Admin Page - User is not admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Admin Page - Exception in checkAdminAccess:', error);
      router.push('/dashboard');
    }
  };

  const loadData = async () => {
    try {
      console.log('Admin Page - Starting to load data...');

      // إجمالي المستخدمين
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error loading total users:', usersError);
      }

      // المستخدمين النشطين (آخر 30 يوم)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      // إجمالي النقاط
      const { data: pointsData } = await supabase
        .from('profiles')
        .select('total_points');
      const totalPoints = pointsData?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0;

      // الاشتراكات المدفوعة
      const { count: paidSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .neq('plan_id', 'free');

      // إجمالي الحملات
      const { count: totalCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        paidSubscriptions: paidSubscriptions || 0,
        totalPoints,
        totalCampaigns: totalCampaigns || 0,
      });

      console.log('Admin Page - Stats loaded:', {
        totalUsers,
        activeUsers,
        paidSubscriptions,
        totalPoints,
        totalCampaigns,
      });

      // آخر 5 مستخدمين - نحتاج البريد الإلكتروني من auth.users
      // ملاحظة: في client-side لا يمكننا الوصول لـ auth.users مباشرة
      // سنستخدم placeholder للبريد حتى نضيف edge function إذا لزم الأمر
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, total_points')
        .order('created_at', { ascending: false })
        .limit(5);

      if (users) {
        // إضافة placeholder للبريد الإلكتروني
        const usersWithEmail = users.map((user) => ({
          ...user,
          email: 'user@socialpro.com', // placeholder
        }));
        setRecentUsers(usersWithEmail as RecentUser[]);
        console.log('Admin Page - Recent users loaded:', users.length);
      }

      // نمو المستخدمين (آخر 7 أيام)
      const growthData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', `${dateStr}T23:59:59`);

        growthData.push({
          date: dateStr,
          users: count || 0,
        });
      }
      setUserGrowth(growthData);
      console.log('Admin Page - Growth data loaded:', growthData.length, 'days');
    } catch (error) {
      console.error('Admin Page - Error loading data:', error);
    } finally {
      setLoading(false);
      console.log('Admin Page - Data loading completed');
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المسؤول</h1>
          <p className="text-gray-600 mt-1">إدارة ومراقبة المنصة</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">إجمالي المستخدمين</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <ArrowUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">نشطون (30 يوم)</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUsers}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">اشتراكات مدفوعة</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.paidSubscriptions}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">إجمالي النقاط</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalPoints.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">إجمالي الحملات</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCampaigns}</p>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">نمو المستخدمين (آخر 7 أيام)</h2>
            <ResponsiveContainer width="100%" height={250}>
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
                  dot={{ r: 5, fill: '#9D4EDD' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">آخر المستخدمين المسجلين</h2>
              <Link
                href="/admin/users"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                عرض الكل
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.full_name || 'غير محدد'}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-primary">{user.total_points} نقطة</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Users className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">إدارة المستخدمين</h3>
            <p className="text-gray-600 text-sm">عرض وتعديل معلومات المستخدمين والصلاحيات</p>
          </Link>

          <Link
            href="/admin/stats"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">الإحصائيات المتقدمة</h3>
            <p className="text-gray-600 text-sm">تقارير شاملة وتحليلات تفصيلية</p>
          </Link>

          <Link
            href="/admin/subscriptions"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <CreditCard className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">الاشتراكات</h3>
            <p className="text-gray-600 text-sm">إدارة ومراقبة الاشتراكات والمدفوعات</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
