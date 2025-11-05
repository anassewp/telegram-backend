'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Megaphone, 
  Plus, 
  Play, 
  Pause, 
  Trash2,
  Eye,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  X,
  Send,
  RefreshCw,
  Loader2
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed'
  message: string
  campaign_type: 'groups' | 'members' | 'mixed'
  target_type: 'groups' | 'members' | 'both'
  sent_count: number
  failed_count: number
  total_targets: number
  start_date: string
  created_at: string
  started_at?: string
  completed_at?: string
  session_ids: string[]
}

interface TelegramGroup {
  id: string
  telegram_group_id: number
  title: string
  username: string | null
  members_count: number
  type: string
}

interface TelegramSession {
  id: string
  session_name: string
  phone: string
  status: string
}

export default function CampaignsPage() {
  const [mounted, setMounted] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [sessions, setSessions] = useState<TelegramSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    campaign_type: 'groups' as 'groups' | 'members' | 'mixed',
    message_text: '',
    target_type: 'groups' as 'groups' | 'members' | 'both',
    selected_groups: [] as number[],
    selected_members: [] as number[],
    session_ids: [] as string[],
    distribution_strategy: 'equal' as 'equal' | 'round_robin' | 'random' | 'weighted',
    max_messages_per_session: 100,
    max_messages_per_day: 200,
    delay_between_messages_min: 30,
    delay_between_messages_max: 90,
    delay_variation: true,
    exclude_sent_members: true,
    exclude_bots: true,
    exclude_premium: false,
    exclude_verified: false,
    exclude_scam: true,
    exclude_fake: true,
    personalize_messages: false,
    vary_emojis: false,
    schedule_at: ''
  })

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // جلب الحملات من telegram_campaigns الجديد
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('telegram_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (campaignsError) throw campaignsError

      // تحويل البيانات إلى تنسيق الصفحة
      const formattedCampaigns = (campaignsData || []).map((camp: any) => ({
        id: camp.id,
        name: camp.name,
        message: camp.message_text,
        status: camp.status,
        campaign_type: camp.campaign_type,
        target_type: camp.target_type,
        sent_count: camp.sent_count || 0,
        failed_count: camp.failed_count || 0,
        total_targets: camp.total_targets || 0,
        start_date: camp.started_at || camp.created_at,
        created_at: camp.created_at,
        started_at: camp.started_at,
        completed_at: camp.completed_at,
        session_ids: camp.session_ids || []
      }))

      setCampaigns(formattedCampaigns)

      // جلب المجموعات
      const { data: groupsData, error: groupsError } = await supabase
        .from('telegram_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('title')

      if (groupsError) throw groupsError
      setGroups(groupsData || [])

      // جلب الجلسات
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (sessionsError) throw sessionsError
      setSessions(sessionsData || [])

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    // Validation
    if (!formData.name || !formData.message_text || formData.session_ids.length === 0) {
      setError('الرجاء ملء جميع الحقول المطلوبة')
      return
    }

    if (formData.target_type === 'groups' || formData.target_type === 'both') {
      if (formData.selected_groups.length === 0) {
        setError('يجب تحديد مجموعة واحدة على الأقل')
        return
      }
    }

    if (formData.target_type === 'members' || formData.target_type === 'both') {
      if (formData.selected_members.length === 0) {
        setError('يجب تحديد عضو واحد على الأقل')
        return
      }
    }

    setSending(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      // إنشاء الحملة عبر Edge Function الجديدة
      const { data, error: createError } = await supabase.functions.invoke('telegram-campaign-create', {
        body: {
          user_id: user.id,
          ...formData
        }
      })

      if (createError) throw createError

      if (data?.error) {
        throw new Error(data.error.message || 'فشل في إنشاء الحملة')
      }

      if (!data?.success) {
        throw new Error('فشل في إنشاء الحملة')
      }

      setSuccess('تم إنشاء الحملة بنجاح!')
      setShowCreateModal(false)
      setFormData({
        name: '',
        campaign_type: 'groups',
        message_text: '',
        target_type: 'groups',
        selected_groups: [],
        selected_members: [],
        session_ids: [],
        distribution_strategy: 'equal',
        max_messages_per_session: 100,
        max_messages_per_day: 200,
        delay_between_messages_min: 30,
        delay_between_messages_max: 90,
        delay_variation: true,
        exclude_sent_members: true,
        exclude_bots: true,
        exclude_premium: false,
        exclude_verified: false,
        exclude_scam: true,
        exclude_fake: true,
        personalize_messages: false,
        vary_emojis: false,
        schedule_at: ''
      })
      
      // إعادة تحميل البيانات
      setTimeout(() => {
        fetchData()
      }, 1000)

    } catch (err: any) {
      console.error('Error creating campaign:', err)
      setError(err.message || 'حدث خطأ أثناء إنشاء الحملة')
    } finally {
      setSending(false)
    }
  }

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      const { data, error } = await supabase.functions.invoke('telegram-campaign-start', {
        body: {
          campaign_id: campaignId,
          user_id: user.id
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error.message)

      setSuccess('تم بدء الحملة بنجاح')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'فشل في بدء الحملة')
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      const { data, error } = await supabase.functions.invoke('telegram-campaign-pause', {
        body: {
          campaign_id: campaignId,
          user_id: user.id
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error.message)

      setSuccess('تم إيقاف الحملة مؤقتاً')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'فشل في إيقاف الحملة')
    }
  }

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      const { data, error } = await supabase.functions.invoke('telegram-campaign-resume', {
        body: {
          campaign_id: campaignId,
          user_id: user.id
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error.message)

      setSuccess('تم استئناف الحملة بنجاح')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'فشل في استئناف الحملة')
    }
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const styles = {
      draft: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
      scheduled: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      active: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      paused: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      completed: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      failed: 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
    }

    const labels = {
      draft: 'مسودة',
      scheduled: 'مجدولة',
      active: 'نشطة',
      paused: 'متوقفة',
      completed: 'مكتملة',
      failed: 'فاشلة'
    }

    return (
      <span className={`px-3 py-1 ${styles[status]} text-xs font-bold rounded-full`}>
        {labels[status]}
      </span>
    )
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-neutral-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    sent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
    failed: campaigns.reduce((sum, c) => sum + c.failed_count, 0),
    success_rate: campaigns.length > 0 
      ? Math.round((campaigns.reduce((sum, c) => sum + c.sent_count, 0) / 
                    Math.max(campaigns.reduce((sum, c) => sum + c.total_targets, 0), 1)) * 100) 
      : 0
  }

  return (
    <div className="space-y-8" style={{
      animation: 'fadeIn 0.3s ease-out'
    }}>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 p-8">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
                <Megaphone className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">الحملات</h1>
                <p className="text-white/90 text-lg mt-1">أنشئ وأدر حملاتك التسويقية بسهولة</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 hover:bg-white/90 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>إنشاء حملة جديدة</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError('')} className="mr-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
          <button onClick={() => setSuccess('')} className="mr-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <Megaphone className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{stats.total}</div>
            <div className="text-white/80 text-sm">إجمالي الحملات</div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <Play className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{stats.active}</div>
            <div className="text-white/80 text-sm">حملات نشطة</div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <MessageSquare className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{stats.sent.toLocaleString()}</div>
            <div className="text-white/80 text-sm">رسائل مرسلة</div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{stats.success_rate}%</div>
            <div className="text-white/80 text-sm">معدل النجاح</div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">جميع الحملات</h2>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="bg-gradient-to-br from-orange-100 to-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حملات</h3>
            <p className="text-gray-600 mb-6">ابدأ بإنشاء حملتك الأولى للوصول لجمهورك</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              إنشاء حملة جديدة
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{campaign.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{campaign.total_targets} هدف</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>{campaign.session_ids?.length || 0} جلسة</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(campaign.start_date || campaign.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {campaign.status !== 'scheduled' && campaign.status !== 'draft' && campaign.total_targets > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>التقدم</span>
                      <span>{campaign.sent_count.toLocaleString()} / {campaign.total_targets.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-600 to-red-600 rounded-full transition-all"
                        style={{ width: `${Math.min((campaign.sent_count / campaign.total_targets) * 100, 100)}%` }}
                      />
                    </div>
                    {campaign.failed_count > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        {campaign.failed_count} فشل
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                    <button 
                      onClick={() => handleStartCampaign(campaign.id)}
                      className="flex-1 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>بدء</span>
                    </button>
                  ) : campaign.status === 'active' ? (
                    <button 
                      onClick={() => handlePauseCampaign(campaign.id)}
                      className="flex-1 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      <span>إيقاف</span>
                    </button>
                  ) : campaign.status === 'paused' ? (
                    <button 
                      onClick={() => handleResumeCampaign(campaign.id)}
                      className="flex-1 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>استئناف</span>
                    </button>
                  ) : null}
                  
                  <button 
                    onClick={() => fetchData()}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>تحديث</span>
                  </button>
                  
                  <button className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" style={{
            animation: 'slideUp 0.4s ease-out'
          }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-100 to-red-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">إنشاء حملة جديدة</h3>
                  <p className="text-gray-600 text-sm">أرسل رسائل إلى مجموعاتك على Telegram</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({
                    name: '',
                    campaign_type: 'groups',
                    message_text: '',
                    target_type: 'groups',
                    selected_groups: [],
                    selected_members: [],
                    session_ids: [],
                    distribution_strategy: 'equal',
                    max_messages_per_session: 100,
                    max_messages_per_day: 200,
                    delay_between_messages_min: 30,
                    delay_between_messages_max: 90,
                    delay_variation: true,
                    exclude_sent_members: true,
                    exclude_bots: true,
                    exclude_premium: false,
                    exclude_verified: false,
                    exclude_scam: true,
                    exclude_fake: true,
                    personalize_messages: false,
                    vary_emojis: false,
                    schedule_at: ''
                  })
                  setError('')
                }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">معلومات أساسية</h4>
                
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اسم الحملة *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: حملة عروض الصيف"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Campaign Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نوع الحملة
                  </label>
                  <select
                    value={formData.campaign_type}
                    onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="groups">مجموعات فقط</option>
                    <option value="members">أعضاء فقط</option>
                    <option value="mixed">مختلط</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نص الرسالة *
                  </label>
                  <textarea
                    value={formData.message_text}
                    onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                    placeholder="اكتب رسالتك هنا... (استخدم {name} للتخصيص بالاسم)"
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">استخدم {`{name}`} للتخصيص بالاسم أو {`{username}`} للاسم المستخدم</p>
                </div>
              </div>

              {/* Target Selection */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">اختيار الأهداف</h4>
                
                {/* Target Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نوع الهدف
                  </label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any, selected_groups: [], selected_members: [] })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="groups">مجموعات</option>
                    <option value="members">أعضاء</option>
                    <option value="both">كلاهما</option>
                  </select>
                </div>

                {/* Groups Selection */}
                {(formData.target_type === 'groups' || formData.target_type === 'both') && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      اختر المجموعات ({formData.selected_groups.length} محدد) *
                    </label>
                    <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 space-y-2">
                      {groups.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          لا توجد مجموعات. استورد مجموعاتك أولاً من صفحة المجموعات.
                        </p>
                      ) : (
                        groups.map((group) => (
                          <label
                            key={group.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selected_groups.includes(group.telegram_group_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    selected_groups: [...formData.selected_groups, group.telegram_group_id]
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    selected_groups: formData.selected_groups.filter(id => id !== group.telegram_group_id)
                                  })
                                }
                              }}
                              className="w-5 h-5 text-orange-600 rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{group.title}</div>
                              <div className="text-xs text-gray-500">
                                {group.members_count.toLocaleString()} عضو • {group.type}
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Members Selection - Placeholder for now */}
                {(formData.target_type === 'members' || formData.target_type === 'both') && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      اختر الأعضاء ({formData.selected_members.length} محدد) *
                    </label>
                    <div className="border-2 border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-gray-500 text-sm">سيتم إضافة اختيار الأعضاء قريباً</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sessions & Distribution */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">الجلسات والتوزيع</h4>
                
                {/* Sessions Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اختر الجلسات ({formData.session_ids.length} محدد) *
                  </label>
                  <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 space-y-2">
                    {sessions.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        لا توجد جلسات نشطة. أضف جلسة أولاً من صفحة الجلسات.
                      </p>
                    ) : (
                      sessions.map((session) => (
                        <label
                          key={session.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.session_ids.includes(session.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  session_ids: [...formData.session_ids, session.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  session_ids: formData.session_ids.filter(id => id !== session.id)
                                })
                              }
                            }}
                            className="w-5 h-5 text-orange-600 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{session.session_name}</div>
                            <div className="text-xs text-gray-500">{session.phone}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Distribution Strategy */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    استراتيجية التوزيع
                  </label>
                  <select
                    value={formData.distribution_strategy}
                    onChange={(e) => setFormData({ ...formData, distribution_strategy: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="equal">متساوي</option>
                    <option value="round_robin">دوري</option>
                    <option value="random">عشوائي</option>
                    <option value="weighted">مرجح</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">كيفية توزيع المهام بين الجلسات</p>
                </div>
              </div>

              {/* Advanced Settings - Collapsible */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">إعدادات متقدمة</h4>
                
                {/* Delay Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      الحد الأدنى للتأخير (ثانية)
                    </label>
                    <input
                      type="number"
                      value={formData.delay_between_messages_min}
                      onChange={(e) => setFormData({ ...formData, delay_between_messages_min: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      الحد الأقصى للتأخير (ثانية)
                    </label>
                    <input
                      type="number"
                      value={formData.delay_between_messages_max}
                      onChange={(e) => setFormData({ ...formData, delay_between_messages_max: parseInt(e.target.value) || 90 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">خيارات الاستبعاد</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.exclude_sent_members}
                        onChange={(e) => setFormData({ ...formData, exclude_sent_members: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm text-gray-700">استبعاد المرسل لهم سابقاً</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.exclude_bots}
                        onChange={(e) => setFormData({ ...formData, exclude_bots: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm text-gray-700">استبعاد البوتات</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.exclude_premium}
                        onChange={(e) => setFormData({ ...formData, exclude_premium: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm text-gray-700">استبعاد Premium</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.exclude_scam}
                        onChange={(e) => setFormData({ ...formData, exclude_scam: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm text-gray-700">استبعاد Scam</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.exclude_fake}
                        onChange={(e) => setFormData({ ...formData, exclude_fake: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm text-gray-700">استبعاد Fake</span>
                    </label>
                  </div>
                </div>

                {/* Message Options */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">خيارات الرسائل</label>
                  <label className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.personalize_messages}
                      onChange={(e) => setFormData({ ...formData, personalize_messages: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span className="text-sm text-gray-700">تخصيص الرسائل بالاسم</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.vary_emojis}
                      onChange={(e) => setFormData({ ...formData, vary_emojis: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span className="text-sm text-gray-700">تنويع الإيموجي</span>
                  </label>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  جدولة (اختياري)
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule_at}
                  onChange={(e) => setFormData({ ...formData, schedule_at: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">اتركه فارغاً للإرسال الفوري</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({
                      name: '',
                      campaign_type: 'groups',
                      message_text: '',
                      target_type: 'groups',
                      selected_groups: [],
                      selected_members: [],
                      session_ids: [],
                      distribution_strategy: 'equal',
                      max_messages_per_session: 100,
                      max_messages_per_day: 200,
                      delay_between_messages_min: 30,
                      delay_between_messages_max: 90,
                      delay_variation: true,
                      exclude_sent_members: true,
                      exclude_bots: true,
                      exclude_premium: false,
                      exclude_verified: false,
                      exclude_scam: true,
                      exclude_fake: true,
                      personalize_messages: false,
                      vary_emojis: false,
                      schedule_at: ''
                    })
                    setError('')
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  disabled={sending}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={sending || !formData.name || !formData.message_text || formData.session_ids.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {formData.schedule_at ? 'حفظ كمسودة' : 'إنشاء الحملة'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
