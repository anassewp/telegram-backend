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
  status: 'active' | 'paused' | 'completed' | 'scheduled'
  message: string
  target_groups: number
  sent_messages: number
  total_targets: number
  start_date: string
  created_at: string
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
    message: '',
    session_id: '',
    selected_groups: [] as string[],
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

      // جلب الحملات من telegram_campaign_messages (مجموعة حسب campaign_id)
      const { data: messages, error: messagesError } = await supabase
        .from('telegram_campaign_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (messagesError) throw messagesError

      // تجميع البيانات حسب campaign_id
      const campaignsMap = new Map<string, any>()
      
      if (messages && messages.length > 0) {
        messages.forEach((msg: any) => {
          if (!campaignsMap.has(msg.campaign_id)) {
            campaignsMap.set(msg.campaign_id, {
              id: msg.campaign_id,
              name: `حملة ${msg.campaign_id.slice(0, 8)}`,
              message: msg.message_text,
              target_groups: 0,
              sent_messages: 0,
              total_targets: 0,
              status: 'active',
              start_date: msg.created_at,
              created_at: msg.created_at
            })
          }
          
          const campaign = campaignsMap.get(msg.campaign_id)
          campaign.target_groups++
          if (msg.status === 'sent') campaign.sent_messages++
          campaign.total_targets++
          
          if (msg.status === 'failed') {
            campaign.status = 'paused'
          } else if (campaign.sent_messages === campaign.total_targets) {
            campaign.status = 'completed'
          }
        })
      }

      setCampaigns(Array.from(campaignsMap.values()))

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
    if (!formData.name || !formData.message || !formData.session_id || formData.selected_groups.length === 0) {
      setError('الرجاء ملء جميع الحقول')
      return
    }

    setSending(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      // إنشاء campaign_id جديد
      const campaign_id = crypto.randomUUID()

      // جلب group_ids المحددة
      const selectedGroups = groups.filter(g => formData.selected_groups.includes(g.id))
      const group_ids = selectedGroups.map(g => g.telegram_group_id || g.group_id)

      // إرسال الرسائل عبر Edge Function
      const { data, error: sendError } = await supabase.functions.invoke('telegram-send-message', {
        body: {
          campaign_id: campaign_id,
          user_id: user.id,
          session_id: formData.session_id,
          group_ids: group_ids,
          message: formData.message,
          schedule_at: formData.schedule_at || null
        }
      })

      if (sendError) throw sendError

      if (data?.error) {
        throw new Error(data.error.message || 'فشل في إرسال الرسائل')
      }

      setSuccess(`تم إرسال ${data?.data?.successful || 0} رسالة بنجاح`)
      setShowCreateModal(false)
      setFormData({
        name: '',
        message: '',
        session_id: '',
        selected_groups: [],
        schedule_at: ''
      })
      
      // إعادة تحميل البيانات
      setTimeout(() => {
        fetchData()
      }, 1000)

    } catch (err: any) {
      console.error('Error sending messages:', err)
      setError(err.message || 'حدث خطأ أثناء إرسال الرسائل')
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const styles = {
      active: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      paused: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      completed: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
      scheduled: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
    }

    const labels = {
      active: 'نشطة',
      paused: 'متوقفة',
      completed: 'مكتملة',
      scheduled: 'مجدولة'
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
    sent: campaigns.reduce((sum, c) => sum + c.sent_messages, 0),
    success_rate: campaigns.length > 0 
      ? Math.round((campaigns.reduce((sum, c) => sum + c.sent_messages, 0) / 
                    campaigns.reduce((sum, c) => sum + c.total_targets, 0)) * 100) 
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
                    <p className="text-gray-600 text-sm mb-3">{campaign.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{campaign.target_groups} مجموعات</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(campaign.start_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {campaign.status !== 'scheduled' && campaign.total_targets > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>التقدم</span>
                      <span>{campaign.sent_messages.toLocaleString()} / {campaign.total_targets.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-600 to-red-600 rounded-full transition-all"
                        style={{ width: `${(campaign.sent_messages / campaign.total_targets) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => fetchData()}
                    className="flex-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
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
                    message: '',
                    session_id: '',
                    selected_groups: [],
                    schedule_at: ''
                  })
                  setError('')
                }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم الحملة
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: حملة عروض الصيف"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  نص الرسالة
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="اكتب رسالتك هنا..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">يمكنك إرسال رسالة نصية إلى المجموعات المحددة</p>
              </div>

              {/* Session Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اختر الجلسة
                </label>
                <select
                  value={formData.session_id}
                  onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="">-- اختر جلسة --</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.session_name} ({session.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Groups Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اختر المجموعات ({formData.selected_groups.length} محدد)
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
                          checked={formData.selected_groups.includes(group.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selected_groups: [...formData.selected_groups, group.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                selected_groups: formData.selected_groups.filter(id => id !== group.id)
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
                      message: '',
                      session_id: '',
                      selected_groups: [],
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
                  disabled={sending || !formData.name || !formData.message || !formData.session_id || formData.selected_groups.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      إرسال الآن
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
