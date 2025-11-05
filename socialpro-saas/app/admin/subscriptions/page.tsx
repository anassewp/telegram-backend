'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Filter,
  RefreshCw,
  X,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  user_name: string;
  user_email: string;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    revenue: 0,
  });

  useEffect(() => {
    checkAdminAccess();
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, statusFilter, planFilter]);

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

  const loadSubscriptions = async () => {
    try {
      const { data: subsData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (subsData) {
        const subsWithUserInfo = await Promise.all(
          subsData.map(async (sub) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', sub.user_id)
              .single();

            const { data: authData } = await supabase.auth.admin.getUserById(sub.user_id);

            return {
              ...sub,
              user_name: profile?.full_name || 'غير محدد',
              user_email: authData?.user?.email || 'غير متوفر',
            };
          })
        );

        setSubscriptions(subsWithUserInfo);
        setFilteredSubs(subsWithUserInfo);

        // حساب الإحصائيات
        const activeCount = subsWithUserInfo.filter((s) => s.status === 'active').length;
        setStats({
          total: subsWithUserInfo.length,
          active: activeCount,
          revenue: activeCount * 299, // افتراضي
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل الاشتراكات:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.plan_id === planFilter);
    }

    setFilteredSubs(filtered);
  };

  const handleRenew = async (subId: string) => {
    if (!confirm('هل أنت متأكد من تجديد هذا الاشتراك؟')) return;

    try {
      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          end_date: newEndDate.toISOString(),
        })
        .eq('id', subId);

      if (error) throw error;

      alert('تم تجديد الاشتراك بنجاح');
      loadSubscriptions();
    } catch (error) {
      console.error('خطأ في تجديد الاشتراك:', error);
      alert('حدث خطأ أثناء التجديد');
    }
  };

  const handleCancel = async (subId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الاشتراك؟')) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subId);

      if (error) throw error;

      alert('تم إلغاء الاشتراك بنجاح');
      loadSubscriptions();
    } catch (error) {
      console.error('خطأ في إلغاء الاشتراك:', error);
      alert('حدث خطأ أثناء الإلغاء');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    const labels: any = {
      active: 'نشط',
      expired: 'منتهي',
      cancelled: 'ملغي',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPlanName = (planId: string) => {
    const plans: any = {
      free: 'مجاني',
      monthly: 'شهري',
      annual: 'سنوي',
      lifetime: 'مدى الحياة',
    };
    return plans[planId] || planId;
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
            <CreditCard className="w-8 h-8" />
            إدارة الاشتراكات
          </h1>
          <p className="text-gray-600 mt-1">مراقبة وإدارة اشتراكات المستخدمين</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الاشتراكات</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الاشتراكات النشطة</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الإيرادات المتوقعة</p>
                <p className="text-3xl font-bold text-purple-600">${stats.revenue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="expired">منتهي</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
            <div className="flex-1">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">جميع الخطط</option>
                <option value="free">مجاني</option>
                <option value="monthly">شهري</option>
                <option value="annual">سنوي</option>
                <option value="lifetime">مدى الحياة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الخطة
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    تاريخ البدء
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    تاريخ الانتهاء
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    التجديد التلقائي
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{sub.user_name}</p>
                        <p className="text-sm text-gray-600">{sub.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {getPlanName(sub.plan_id)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sub.start_date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString('ar-SA') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {sub.auto_renew ? (
                        <span className="text-green-600 text-sm">نعم</span>
                      ) : (
                        <span className="text-gray-400 text-sm">لا</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRenew(sub.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="تجديد"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(sub.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="إلغاء"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
