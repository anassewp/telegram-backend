'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Target,
  TrendingUp,
  Users as UsersIcon,
  Clock,
} from 'lucide-react';
import Image from 'next/image';

interface Campaign {
  id: string;
  name: string;
  platform_id: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  start_date: string;
  end_date: string;
  budget: number;
  clicks: number;
  views: number;
  conversions: number;
  created_at: string;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);

      // تحميل الحملات
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignsData) {
        setCampaigns(campaignsData);
      }

      // تحميل المنصات
      const response = await fetch('/data/platforms.json');
      const platformsData = await response.json();
      setPlatforms(platformsData.platforms);
    }
    setLoading(false);
  };

  const getPlatform = (platformId: string) => {
    return platforms.find(p => p.id === platformId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-neutral-100 text-neutral-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشطة';
      case 'paused': return 'متوقفة';
      case 'completed': return 'مكتملة';
      case 'draft': return 'مسودة';
      default: return status;
    }
  };

  const handleCreateCampaign = async () => {
    // محاكاة إنشاء حملة جديدة
    const newCampaign = {
      user_id: userId,
      name: 'حملة جديدة',
      platform_id: 'whatsapp',
      status: 'draft',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 1000,
      target_audience: {},
      settings: {},
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(newCampaign)
      .select()
      .single();

    if (!error && data) {
      setCampaigns([data, ...campaigns]);
      setShowNewCampaignModal(false);
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase
      .from('campaigns')
      .update({ status: newStatus })
      .eq('id', campaignId);

    if (!error) {
      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, status: newStatus as any } : c
      ));
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (!error) {
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">جاري تحميل الحملات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            الحملات التسويقية
          </h1>
          <p className="text-neutral-600">
            أنشئ وأدر حملاتك التسويقية عبر جميع المنصات
          </p>
        </div>
        <button
          onClick={() => setShowNewCampaignModal(true)}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold btn-transition hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إنشاء حملة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">إجمالي الحملات</span>
            <Target className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-3xl font-bold text-neutral-900">{stats.total}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">نشطة</span>
            <Play className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">متوقفة</span>
            <Pause className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">{stats.paused}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">مكتملة</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن حملة..."
              className="w-full pr-12 pl-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشطة</option>
            <option value="paused">متوقفة</option>
            <option value="completed">مكتملة</option>
            <option value="draft">مسودة</option>
          </select>

          <button className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            المزيد من الفلاتر
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-16 text-center">
          <Target className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">
            لا توجد حملات حالياً
          </h3>
          <p className="text-neutral-600 mb-6">
            ابدأ بإنشاء أول حملة تسويقية لك
          </p>
          <button
            onClick={() => setShowNewCampaignModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold btn-transition hover:bg-primary-700"
          >
            إنشاء حملة الآن
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">اسم الحملة</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">المنصة</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">التاريخ</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">الأداء</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredCampaigns.map((campaign) => {
                  const platform = getPlatform(campaign.platform_id);
                  return (
                    <tr key={campaign.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-900">{campaign.name}</div>
                        <div className="text-sm text-neutral-600">
                          الميزانية: ${campaign.budget}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {platform && (
                          <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8">
                              <Image
                                src={platform.icon}
                                alt={platform.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <span className="text-sm text-neutral-700">{platform.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusText(campaign.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Clock className="w-4 h-4" />
                          {new Date(campaign.start_date).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="w-4 h-4 text-neutral-400" />
                            <span className="text-neutral-900">{campaign.views || 0}</span>
                            <span className="text-neutral-500">مشاهدة</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <UsersIcon className="w-4 h-4 text-neutral-400" />
                            <span className="text-neutral-900">{campaign.clicks || 0}</span>
                            <span className="text-neutral-500">نقرة</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {campaign.status === 'active' || campaign.status === 'paused' ? (
                            <button
                              onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                              title={campaign.status === 'active' ? 'إيقاف مؤقت' : 'تفعيل'}
                            >
                              {campaign.status === 'active' ? (
                                <Pause className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <Play className="w-4 h-4 text-green-600" />
                              )}
                            </button>
                          ) : null}
                          <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors" title="تحرير">
                            <Edit className="w-4 h-4 text-neutral-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              إنشاء حملة جديدة
            </h3>
            <p className="text-neutral-600 mb-6">
              سيتم إنشاء حملة جديدة كمسودة يمكنك تعديلها لاحقاً
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCreateCampaign}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold btn-transition hover:bg-primary-700"
              >
                إنشاء
              </button>
              <button
                onClick={() => setShowNewCampaignModal(false)}
                className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
