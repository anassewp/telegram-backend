'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users as UsersIcon,
  MousePointer,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  FileText,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
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

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface DailyPerformance {
  date: string;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
}

interface PlatformDistribution {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export default function ReportsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // مقاييس رئيسية
  const [metrics, setMetrics] = useState({
    totalReach: 125840,
    engagementRate: 8.5,
    totalClicks: 12453,
    totalConversions: 2340,
  });

  // بيانات الأداء اليومي
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([
    { date: '2025-10-03', reach: 4200, engagement: 356, clicks: 420, conversions: 78 },
    { date: '2025-10-04', reach: 4500, engagement: 405, clicks: 450, conversions: 85 },
    { date: '2025-10-05', reach: 3800, engagement: 342, clicks: 380, conversions: 72 },
    { date: '2025-10-06', reach: 5100, engagement: 459, clicks: 510, conversions: 96 },
    { date: '2025-10-07', reach: 4800, engagement: 432, clicks: 480, conversions: 91 },
    { date: '2025-10-08', reach: 5400, engagement: 486, clicks: 540, conversions: 102 },
    { date: '2025-10-09', reach: 4900, engagement: 441, clicks: 490, conversions: 93 },
    { date: '2025-10-10', reach: 5200, engagement: 468, clicks: 520, conversions: 98 },
    { date: '2025-10-11', reach: 4700, engagement: 423, clicks: 470, conversions: 89 },
    { date: '2025-10-12', reach: 5600, engagement: 504, clicks: 560, conversions: 106 },
    { date: '2025-10-13', reach: 5300, engagement: 477, clicks: 530, conversions: 100 },
    { date: '2025-10-14', reach: 4600, engagement: 414, clicks: 460, conversions: 87 },
    { date: '2025-10-15', reach: 5800, engagement: 522, clicks: 580, conversions: 110 },
    { date: '2025-10-16', reach: 5100, engagement: 459, clicks: 510, conversions: 96 },
    { date: '2025-10-17', reach: 4900, engagement: 441, clicks: 490, conversions: 93 },
  ]);

  // بيانات أداء المنصات
  const [platformPerformance, setPlatformPerformance] = useState([
    { platform: 'WhatsApp', reach: 35000, engagement: 2975, conversions: 665 },
    { platform: 'Facebook', reach: 28000, engagement: 2380, conversions: 532 },
    { platform: 'Instagram', reach: 22000, engagement: 1870, conversions: 418 },
    { platform: 'Twitter', reach: 18000, engagement: 1530, conversions: 342 },
    { platform: 'Telegram', reach: 15000, engagement: 1275, conversions: 285 },
    { platform: 'LinkedIn', reach: 7840, engagement: 666, conversions: 149 },
  ]);

  // توزيع المنصات
  const [platformDistribution, setPlatformDistribution] = useState<PlatformDistribution[]>([
    { name: 'WhatsApp', value: 35, color: '#25D366' },
    { name: 'Facebook', value: 28, color: '#1877F2' },
    { name: 'Instagram', value: 22, color: '#E4405F' },
    { name: 'Twitter', value: 18, color: '#1DA1F2' },
    { name: 'Telegram', value: 15, color: '#0088CC' },
    { name: 'أخرى', value: 7, color: '#9D4EDD' },
  ]);

  useEffect(() => {
    loadPlatforms();
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/data/platforms.json');
      const data = await response.json();
      setPlatforms(data);
    } catch (error) {
      console.error('خطأ في تحميل المنصات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert('سيتم تصدير التقرير كملف PDF. هذه ميزة محاكاة في النسخة التجريبية.');
  };

  const handleExportExcel = () => {
    alert('سيتم تصدير التقرير كملف Excel. هذه ميزة محاكاة في النسخة التجريبية.');
  };

  const handleCreateCustomReport = () => {
    setShowCreateReportModal(true);
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case '7days':
        return 'آخر 7 أيام';
      case '30days':
        return 'آخر 30 يوم';
      case '90days':
        return 'آخر 90 يوم';
      case 'custom':
        return 'نطاق مخصص';
      default:
        return 'آخر 30 يوم';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'م';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'ك';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p className="text-gray-600 mt-1">تحليل شامل لأداء حملاتك التسويقية</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير Excel
          </button>
          <button
            onClick={handleCreateCustomReport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            تقرير مخصص
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Date Range Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline ml-1" />
              الفترة الزمنية
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="7days">آخر 7 أيام</option>
              <option value="30days">آخر 30 يوم</option>
              <option value="90days">آخر 90 يوم</option>
              <option value="custom">نطاق مخصص</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline ml-1" />
              المنصة
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">جميع المنصات</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <UsersIcon className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90">إجمالي الوصول</h3>
          <p className="text-3xl font-bold mt-2">{formatNumber(metrics.totalReach)}</p>
          <p className="text-sm opacity-80 mt-2">+12.5% عن الشهر الماضي</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90">معدل التفاعل</h3>
          <p className="text-3xl font-bold mt-2">{metrics.engagementRate}%</p>
          <p className="text-sm opacity-80 mt-2">+2.3% عن الشهر الماضي</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <MousePointer className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90">إجمالي النقرات</h3>
          <p className="text-3xl font-bold mt-2">{formatNumber(metrics.totalClicks)}</p>
          <p className="text-sm opacity-80 mt-2">+8.7% عن الشهر الماضي</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Target className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90">التحويلات</h3>
          <p className="text-3xl font-bold mt-2">{formatNumber(metrics.totalConversions)}</p>
          <p className="text-sm opacity-80 mt-2">+15.2% عن الشهر الماضي</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-primary" />
              الأداء عبر الزمن
            </h2>
            <span className="text-sm text-gray-500">{getDateRangeText()}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
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
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="reach"
                stroke="#3B82F6"
                strokeWidth={2}
                name="الوصول"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="#10B981"
                strokeWidth={2}
                name="التفاعل"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#9D4EDD"
                strokeWidth={2}
                name="النقرات"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              أداء المنصات
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="reach" fill="#3B82F6" name="الوصول" radius={[8, 8, 0, 0]} />
              <Bar dataKey="engagement" fill="#10B981" name="التفاعل" radius={[8, 8, 0, 0]} />
              <Bar dataKey="conversions" fill="#F59E0B" name="التحويلات" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              توزيع المنصات
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={platformDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {platformDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              الأداء التفصيلي
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    التاريخ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    الوصول
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    التفاعل
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    النقرات
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    التحويلات
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    معدل التحويل
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dailyData.slice(0, 7).map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(day.date).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatNumber(day.reach)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatNumber(day.engagement)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatNumber(day.clicks)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatNumber(day.conversions)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {((day.conversions / day.clicks) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Custom Report Modal */}
      {showCreateReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">إنشاء تقرير مخصص</h2>
              <p className="text-gray-600 mt-1">اختر المقاييس والبيانات التي تريد تضمينها</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم التقرير
                </label>
                <input
                  type="text"
                  placeholder="مثال: تقرير الأداء الشهري"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع التقرير
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>تقرير أداء عام</option>
                  <option>تقرير المنصات</option>
                  <option>تقرير الحملات</option>
                  <option>تقرير التحويلات</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المقاييس المطلوبة
                </label>
                <div className="space-y-2">
                  {['الوصول', 'التفاعل', 'النقرات', 'التحويلات', 'معدل التحويل', 'ROI'].map(
                    (metric) => (
                      <label key={metric} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">{metric}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateReportModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  alert('تم إنشاء التقرير المخصص بنجاح!');
                  setShowCreateReportModal(false);
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                إنشاء التقرير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
