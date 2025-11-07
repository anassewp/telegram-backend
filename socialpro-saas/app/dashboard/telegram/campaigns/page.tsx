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
  Loader2,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

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
  group_id: number
  telegram_group_id?: number // للتوافق مع البيانات القديمة
  title: string
  username: string | null
  members_count: number
  type: string
}

interface TelegramMember {
  id: string
  telegram_user_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  is_bot: boolean
  is_premium: boolean
  is_verified: boolean
  is_scam: boolean
  is_fake: boolean
  group_id: number
  group_title?: string
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
  const [members, setMembers] = useState<TelegramMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TelegramMember[]>([])
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<string>('')
  const [sessions, setSessions] = useState<TelegramSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  // لإدخال usernames يدوياً
  const [manualGroupUsernames, setManualGroupUsernames] = useState<string>('')
  const [manualMemberUsernames, setManualMemberUsernames] = useState<string>('')
  const [manualGroupIds, setManualGroupIds] = useState<number[]>([]) // للـ group IDs المدخلة يدوياً
  const [manualMemberIds, setManualMemberIds] = useState<number[]>([]) // للـ member IDs المدخلة يدوياً
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sendingBatch, setSendingBatch] = useState<string | null>(null) // campaign_id الجاري إرسال دفعة لها

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    campaign_type: 'groups' as 'groups' | 'members' | 'mixed',
    message_text: '',
    target_type: 'groups' as 'groups' | 'members' | 'both',
    selected_groups: [] as number[],
    selected_members: [] as number[],
    selected_group_usernames: [] as string[], // للـ usernames غير المحلولة
    selected_member_usernames: [] as string[], // للـ usernames غير المحلولة
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

  // تحديث البيانات كل 10 ثواني للحملات النشطة
  useEffect(() => {
    if (!mounted) return

    const activeCampaigns = campaigns.filter(c => c.status === 'active')
    if (activeCampaigns.length === 0) return

    const interval = setInterval(() => {
      fetchData()
    }, 10000) // كل 10 ثواني

    return () => clearInterval(interval)
  }, [campaigns, mounted])

  const fetchMembersFromGroup = async (groupId: string | number) => {
    setLoadingMembers(true)
    setError('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membersData, error: membersError } = await supabase
        .from('telegram_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', Number(groupId))
        .order('first_name')

      if (membersError) throw membersError
      
      const formattedMembers = (membersData || []).map((m: any) => ({
        id: m.id,
        telegram_user_id: m.telegram_user_id,
        first_name: m.first_name,
        last_name: m.last_name,
        username: m.username,
        is_bot: m.is_bot || false,
        is_premium: m.is_premium || false,
        is_verified: m.is_verified || false,
        is_scam: m.is_scam || false,
        is_fake: m.is_fake || false,
        group_id: Number(groupId)
      }))

      setMembers(formattedMembers)
      
      // تطبيق الفلاتر من formData
      let filtered = formattedMembers
      
      if (formData.exclude_bots) {
        filtered = filtered.filter(m => !m.is_bot)
      }
      if (formData.exclude_premium) {
        filtered = filtered.filter(m => !m.is_premium)
      }
      if (formData.exclude_verified) {
        filtered = filtered.filter(m => !m.is_verified)
      }
      if (formData.exclude_scam) {
        filtered = filtered.filter(m => !m.is_scam)
      }
      if (formData.exclude_fake) {
        filtered = filtered.filter(m => !m.is_fake)
      }
      
      setFilteredMembers(filtered)
      
    } catch (err: any) {
      console.error('Error fetching members:', err)
      setError(err.message || 'حدث خطأ في جلب الأعضاء')
    } finally {
      setLoadingMembers(false)
    }
  }

  // تحديث الفلاتر عند تغيير إعدادات الاستبعاد
  useEffect(() => {
    if (members.length === 0) return
    
    let filtered = [...members]
    
    if (formData.exclude_bots) {
      filtered = filtered.filter(m => !m.is_bot)
    }
    if (formData.exclude_premium) {
      filtered = filtered.filter(m => !m.is_premium)
    }
    if (formData.exclude_verified) {
      filtered = filtered.filter(m => !m.is_verified)
    }
    if (formData.exclude_scam) {
      filtered = filtered.filter(m => !m.is_scam)
    }
    if (formData.exclude_fake) {
      filtered = filtered.filter(m => !m.is_fake)
    }
    
    setFilteredMembers(filtered)
    
    // إزالة الأعضاء المفلترة من الاختيار
    const validMembers = filtered.map(m => m.telegram_user_id)
    const invalidSelected = formData.selected_members.filter(id => !validMembers.includes(id))
    if (invalidSelected.length > 0) {
      setFormData(prev => ({
        ...prev,
        selected_members: prev.selected_members.filter(id => validMembers.includes(id))
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, formData.exclude_bots, formData.exclude_premium, formData.exclude_verified, formData.exclude_scam, formData.exclude_fake])

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

      // جلب المجموعات - فقط المجموعات (ليس القنوات) والتي يمكن الإرسال لها أو استخراج أعضائها
      const { data: groupsData, error: groupsError } = await supabase
        .from('telegram_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('title')

      if (groupsError) throw groupsError
      
      // تحويل البيانات والتأكد من وجود group_id
      let formattedGroups = (groupsData || []).map((g: any) => ({
        ...g,
        group_id: g.group_id || g.telegram_group_id || g.id,
        telegram_group_id: g.telegram_group_id || g.group_id
      }))
      
      // تصفية: فقط المجموعات (ليس القنوات) والتي يمكن الإرسال لها أو استخراج أعضائها بالكامل
      formattedGroups = formattedGroups.filter((g: any) => {
        // استبعاد القنوات
        if (g.type === 'channel') return false
        
        // فقط المجموعات التي يمكن الإرسال لها (can_send === true) أو يمكن استخراج أعضائها بالكامل
        const canSend = g.can_send === true || g.can_send === undefined // إذا لم يتم تحديد can_send، نعتبره true
        const canExtractMembers = g.members_visibility_type === 'fully_visible' || 
                                  (g.members_visibility_type === undefined && g.members_visible === true) ||
                                  (g.members_visibility_type === undefined && g.members_visible === undefined && g.has_visible_participants === true)
        
        return canSend || canExtractMembers
      })
      
      setGroups(formattedGroups)

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

    // التحقق حسب نوع الحملة (مع حساب usernames)
    if (formData.campaign_type === 'groups' || formData.campaign_type === 'mixed') {
      if (formData.target_type === 'groups' || formData.target_type === 'both') {
        const totalGroups = formData.selected_groups.length + formData.selected_group_usernames.length
        if (totalGroups === 0) {
          setError('يجب تحديد مجموعة واحدة على الأقل (ID أو username)')
          return
        }
      }
    }

    if (formData.campaign_type === 'members' || formData.campaign_type === 'mixed') {
      if (formData.target_type === 'members' || formData.target_type === 'both') {
        const totalMembers = formData.selected_members.length + formData.selected_member_usernames.length
        if (totalMembers === 0) {
          setError('يجب تحديد عضو واحد على الأقل (ID أو username)')
          return
        }
      }
    }

    // التحقق من أن هناك أهداف محددة
    const totalTargets = 
      formData.selected_groups.length + formData.selected_group_usernames.length +
      formData.selected_members.length + formData.selected_member_usernames.length
    if (totalTargets === 0) {
      setError('يجب تحديد مجموعة أو عضو واحد على الأقل')
      return
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

      if (createError) {
        console.error('Edge Function Error:', createError)
        // محاولة استخراج رسالة الخطأ من response
        let errorMessage = createError.message || 'حدث خطأ غير معروف'
        if (createError.context && createError.context.body) {
          try {
            const errorBody = typeof createError.context.body === 'string' 
              ? JSON.parse(createError.context.body) 
              : createError.context.body
            if (errorBody.error && errorBody.error.message) {
              errorMessage = errorBody.error.message
            } else if (errorBody.message) {
              errorMessage = errorBody.message
            }
          } catch (e) {
            console.error('Error parsing error body:', e)
          }
        }
        throw new Error(errorMessage)
      }

      if (data?.error) {
        console.error('Error from Edge Function:', data.error)
        throw new Error(data.error.message || 'فشل في إنشاء الحملة')
      }

      if (!data?.success) {
        console.error('Campaign creation failed:', data)
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
      // مسح الحقول اليدوية
      setManualGroupUsernames('')
      setManualMemberUsernames('')
      setManualGroupIds([])
      setManualMemberIds([])
      setSelectedGroupForMembers('')
      setMembers([])
      setFilteredMembers([])
      
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

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحملة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      // حذف الحملة من قاعدة البيانات
      const { error } = await supabase
        .from('telegram_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', user.id)

      if (error) throw error

      setSuccess('تم حذف الحملة بنجاح')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'فشل في حذف الحملة')
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    setError('')
    try {
      await fetchData()
      setSuccess('تم تحديث البيانات')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleSendBatch = async (campaignId: string, silent: boolean = false) => {
    if (sendingBatch) return // منع إرسال متعدد

    setSendingBatch(campaignId)
    if (!silent) {
      setError('')
      setSuccess('')
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      const { data, error } = await supabase.functions.invoke('telegram-campaign-send-batch', {
        body: {
          campaign_id: campaignId,
          user_id: user.id,
          batch_size: 10 // حجم الدفعة
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error.message)

      if (!silent) {
        const sent = data.data?.sent || 0
        const failed = data.data?.failed || 0
        if (failed > 0) {
          setSuccess(`تم إرسال ${sent} رسالة بنجاح، ${failed} فشل`)
        } else {
          setSuccess(`تم إرسال ${sent} رسالة بنجاح`)
        }
        setTimeout(() => setSuccess(''), 5000)
      }
      
      // تحديث البيانات بعد 2 ثانية
      setTimeout(() => {
        fetchData()
      }, 2000)
    } catch (err: any) {
      if (!silent) {
        let errorMessage = err.message || 'فشل في إرسال الدفعة'
        // محاولة استخراج رسالة الخطأ من response
        if (err.context && err.context.body) {
          try {
            const errorBody = typeof err.context.body === 'string' 
              ? JSON.parse(err.context.body) 
              : err.context.body
            if (errorBody.error && errorBody.error.message) {
              errorMessage = errorBody.error.message
            } else if (errorBody.message) {
              errorMessage = errorBody.message
            }
          } catch (e) {
            // تجاهل خطأ parsing
          }
        }
        setError(errorMessage)
        setTimeout(() => setError(''), 5000)
      }
      console.error('Error sending batch:', err)
    } finally {
      setSendingBatch(null)
    }
  }

  // Polling تلقائي للحملات النشطة (بعد تعريف handleSendBatch)
  useEffect(() => {
    if (!mounted) return

    // تحديث البيانات كل 10 ثواني
    const dataInterval = setInterval(() => {
      if (!loading && !sendingBatch) {
        fetchData()
      }
    }, 10000) // كل 10 ثواني

    // إرسال دفعة تلقائياً كل دقيقة للحملات النشطة
    const sendInterval = setInterval(() => {
      if (sendingBatch) return
      
      const activeCampaigns = campaigns.filter(c => c.status === 'active' && c.total_targets > 0)
      if (activeCampaigns.length > 0) {
        // إرسال دفعة للحملة الأولى النشطة (silent mode)
        const campaign = activeCampaigns[0]
        // التحقق من أن الحملة لم تكتمل بعد
        if (campaign.sent_count < campaign.total_targets) {
          handleSendBatch(campaign.id, true)
        }
      }
    }, 60000) // كل دقيقة

    return () => {
      clearInterval(dataInterval)
      clearInterval(sendInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, mounted, sendingBatch, loading])

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
      {/* Back Button */}
      <Link 
        href="/dashboard/telegram"
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-2"
      >
        <ArrowRight className="w-5 h-5" />
        <span className="font-medium">العودة لقسم التيليجرام</span>
      </Link>

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
                {campaign.status !== 'scheduled' && campaign.status !== 'draft' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>التقدم</span>
                      <span>
                        {campaign.sent_count.toLocaleString()} / {Math.max(campaign.total_targets, 1).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-600 to-red-600 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(
                            (campaign.sent_count / Math.max(campaign.total_targets, 1)) * 100, 
                            100
                          )}%` 
                        }}
                      />
                    </div>
                    {campaign.failed_count > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        {campaign.failed_count} فشل
                      </div>
                    )}
                    {campaign.total_targets === 0 && (
                      <div className="text-xs text-yellow-600 mt-1">
                        ⚠️ لا توجد أهداف محددة في هذه الحملة
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
                    <>
                      <button 
                        onClick={() => handlePauseCampaign(campaign.id)}
                        className="flex-1 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        <span>إيقاف</span>
                      </button>
                      <button 
                        onClick={() => handleSendBatch(campaign.id)}
                        disabled={sendingBatch === campaign.id}
                        className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingBatch === campaign.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري الإرسال...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>إرسال دفعة</span>
                          </>
                        )}
                      </button>
                    </>
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
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>تحديث</span>
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    title="حذف الحملة"
                  >
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
                    selected_group_usernames: [],
                    selected_member_usernames: [],
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
                  // مسح الحقول اليدوية
                  setManualGroupUsernames('')
                  setManualMemberUsernames('')
                  setManualGroupIds([])
                  setManualMemberIds([])
                  setSelectedGroupForMembers('')
                  setMembers([])
                  setFilteredMembers([])
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
                    onChange={(e) => {
                      const newType = e.target.value as any
                      setFormData({ 
                        ...formData, 
                        campaign_type: newType,
                        target_type: newType === 'groups' ? 'groups' : newType === 'members' ? 'members' : 'both',
                        selected_groups: newType === 'members' ? [] : formData.selected_groups,
                        selected_members: newType === 'groups' ? [] : formData.selected_members
                      })
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="groups">مجموعات فقط</option>
                    <option value="members">أعضاء فقط</option>
                    <option value="mixed">مختلط</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.campaign_type === 'groups' && 'سيتم إرسال الرسالة للمجموعات المحددة'}
                    {formData.campaign_type === 'members' && 'سيتم إرسال رسائل مباشرة للأعضاء المحددين'}
                    {formData.campaign_type === 'mixed' && 'يمكنك اختيار مجموعات وأعضاء معاً'}
                  </p>
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
                
                {/* Target Type - Only show if campaign_type is mixed */}
                {formData.campaign_type === 'mixed' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      نوع الهدف
                    </label>
                    <select
                      value={formData.target_type}
                      onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any, selected_groups: [], selected_members: [] })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    >
                      <option value="groups">مجموعات فقط</option>
                      <option value="members">أعضاء فقط</option>
                      <option value="both">كلاهما</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">اختر نوع الأهداف للحملة المختلطة</p>
                  </div>
                )}

                {/* Groups Selection */}
                {(formData.campaign_type === 'groups' || 
                  (formData.campaign_type === 'mixed' && (formData.target_type === 'groups' || formData.target_type === 'both'))) && (
                  <div className="space-y-4">
                    {/* إدخال usernames يدوياً */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        إضافة مجموعات يدوياً (usernames أو IDs)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualGroupUsernames}
                          onChange={(e) => setManualGroupUsernames(e.target.value)}
                          placeholder="مثال: @group1 @group2 أو 123456789 -123456789"
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!manualGroupUsernames.trim()) return
                            
                            setError('')
                            const inputs = manualGroupUsernames.trim().split(/\s+/)
                            const newIds: number[] = []
                            const unresolvedUsernames: string[] = []
                            
                            for (const input of inputs) {
                              // إزالة @ إذا كان موجوداً
                              const cleanInput = input.replace(/^@/, '').trim()
                              
                              // محاولة التحويل إلى رقم (ID)
                              const numId = Number(cleanInput)
                              if (!isNaN(numId) && numId !== 0) {
                                newIds.push(numId)
                              } else if (cleanInput) {
                                // البحث في المجموعات المستوردة أولاً
                                const foundGroup = groups.find(g => {
                                  const gUsername = g.username?.toLowerCase().replace('@', '')
                                  return gUsername === cleanInput.toLowerCase()
                                })
                                
                                if (foundGroup) {
                                  const groupId = foundGroup.group_id || foundGroup.telegram_group_id || Number(foundGroup.id)
                                  newIds.push(groupId)
                                } else {
                                  // إذا لم نجدها، نحفظ username (سيتم إرسالها كـ username)
                                  unresolvedUsernames.push(cleanInput)
                                  // يمكن إضافة Edge Function لحل usernames لاحقاً
                                }
                              }
                            }
                            
                            if (newIds.length > 0 || unresolvedUsernames.length > 0) {
                              // حساب uniqueIds و uniqueUsernames
                              let uniqueIds = [...formData.selected_groups]
                              let uniqueUsernames = [...formData.selected_group_usernames]
                              
                              // إضافة IDs المباشرة
                              if (newIds.length > 0) {
                                uniqueIds = [...new Set([...formData.selected_groups, ...newIds])]
                                setManualGroupIds([...new Set([...manualGroupIds, ...newIds])])
                              }
                              
                              // حفظ usernames غير المحلولة
                              if (unresolvedUsernames.length > 0) {
                                uniqueUsernames = [...new Set([...formData.selected_group_usernames, ...unresolvedUsernames])]
                              }
                              
                              // تحديث formData مرة واحدة
                              setFormData({
                                ...formData,
                                selected_groups: uniqueIds,
                                selected_group_usernames: uniqueUsernames
                              })
                              
                              // رسالة النجاح
                              if (unresolvedUsernames.length > 0 && newIds.length > 0) {
                                setSuccess(`تم إضافة ${newIds.length} مجموعة و ${unresolvedUsernames.length} username`)
                              } else if (unresolvedUsernames.length > 0) {
                                setSuccess(`تم إضافة ${unresolvedUsernames.length} username`)
                              } else {
                                setSuccess(`تم إضافة ${newIds.length} مجموعة بنجاح`)
                              }
                              
                              setManualGroupUsernames('')
                              
                              // إخفاء رسالة النجاح بعد 3 ثواني
                              setTimeout(() => setSuccess(''), 3000)
                            } else {
                              setError('لم يتم العثور على أي مجموعة. تأكد من صحة الـ IDs أو usernames')
                            }
                          }}
                          className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
                        >
                          إضافة
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        يمكنك إدخال usernames مثل @group1 أو IDs مثل 123456789 (مفصولة بمسافات)
                      </p>
                    </div>

                    {/* قائمة المجموعات */}
                    <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      اختر المجموعات ({formData.selected_groups.length + formData.selected_group_usernames.length} محدد) *
                    </label>
                      <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 space-y-2">
                        {groups.length === 0 && manualGroupIds.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">
                            لا توجد مجموعات. استورد مجموعاتك أولاً من صفحة المجموعات أو أضف usernames يدوياً.
                          </p>
                        ) : (
                          <>
                            {/* المجموعات المستوردة */}
                            {groups.map((group) => {
                              const groupId = group.group_id || group.telegram_group_id || Number(group.id)
                              return (
                                <label
                                  key={group.id}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.selected_groups.includes(groupId)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          selected_groups: [...formData.selected_groups, groupId]
                                        })
                                      } else {
                                        setFormData({
                                          ...formData,
                                          selected_groups: formData.selected_groups.filter(id => id !== groupId)
                                        })
                                      }
                                    }}
                                    className="w-5 h-5 text-orange-600 rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{group.title}</div>
                                    <div className="text-xs text-gray-500">
                                      {group.members_count.toLocaleString()} عضو • {group.type}
                                      {group.username && ` • @${group.username}`}
                                    </div>
                                  </div>
                                </label>
                              )
                            })}
                            
                            {/* المجموعات المضافة يدوياً (IDs) */}
                            {manualGroupIds.map((groupId) => {
                              if (formData.selected_groups.includes(groupId)) {
                                const foundGroup = groups.find(g => {
                                  const gId = g.group_id || g.telegram_group_id || Number(g.id)
                                  return gId === groupId
                                })
                                
                                if (!foundGroup) {
                                  // مجموعة مضافة يدوياً (غير موجودة في القائمة)
                                  return (
                                    <div
                                      key={`manual-${groupId}`}
                                      className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200"
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={true}
                                          onChange={(e) => {
                                            if (!e.target.checked) {
                                              setFormData({
                                                ...formData,
                                                selected_groups: formData.selected_groups.filter(id => id !== groupId)
                                              })
                                              setManualGroupIds(manualGroupIds.filter(id => id !== groupId))
                                            }
                                          }}
                                          className="w-5 h-5 text-orange-600 rounded"
                                        />
                                        <div>
                                          <div className="font-medium text-gray-900">ID: {groupId}</div>
                                          <div className="text-xs text-blue-600">مضاف يدوياً</div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            selected_groups: formData.selected_groups.filter(id => id !== groupId)
                                          })
                                          setManualGroupIds(manualGroupIds.filter(id => id !== groupId))
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )
                                }
                              }
                              return null
                            })}
                            
                            {/* المجموعات المضافة يدوياً (Usernames) */}
                            {formData.selected_group_usernames.map((username) => (
                              <div
                                key={`manual-username-${username}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200"
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={true}
                                    onChange={(e) => {
                                      if (!e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          selected_group_usernames: formData.selected_group_usernames.filter(u => u !== username)
                                        })
                                      }
                                    }}
                                    className="w-5 h-5 text-orange-600 rounded"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">@{username}</div>
                                    <div className="text-xs text-purple-600">username مضاف يدوياً</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      selected_group_usernames: formData.selected_group_usernames.filter(u => u !== username)
                                    })
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Members Selection */}
                {(formData.campaign_type === 'members' || 
                  (formData.campaign_type === 'mixed' && (formData.target_type === 'members' || formData.target_type === 'both'))) && (
                  <div className="space-y-4">
                    {/* إدخال usernames يدوياً */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        إضافة أعضاء يدوياً (usernames أو IDs)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualMemberUsernames}
                          onChange={(e) => setManualMemberUsernames(e.target.value)}
                          placeholder="مثال: @user1 @user2 أو 123456789 -123456789"
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!manualMemberUsernames.trim()) return
                            
                            setError('')
                            const inputs = manualMemberUsernames.trim().split(/\s+/)
                            const newIds: number[] = []
                            const unresolvedUsernames: string[] = []
                            
                            for (const input of inputs) {
                              // إزالة @ إذا كان موجوداً
                              const cleanInput = input.replace(/^@/, '').trim()
                              
                              // محاولة التحويل إلى رقم (ID)
                              const numId = Number(cleanInput)
                              if (!isNaN(numId) && numId !== 0) {
                                newIds.push(numId)
                              } else if (cleanInput) {
                                // البحث في الأعضاء المحملين أولاً
                                const foundMember = members.find(m => {
                                  const mUsername = m.username?.toLowerCase().replace('@', '')
                                  return mUsername === cleanInput.toLowerCase()
                                })
                                
                                if (foundMember) {
                                  newIds.push(foundMember.telegram_user_id)
                                } else {
                                  // إذا لم نجدها، نحفظ username (سيتم إرسالها كـ username)
                                  unresolvedUsernames.push(cleanInput)
                                  // يمكن إضافة Edge Function لحل usernames لاحقاً
                                }
                              }
                            }
                            
                            if (newIds.length > 0 || unresolvedUsernames.length > 0) {
                              // حساب uniqueIds و uniqueUsernames
                              let uniqueIds = [...formData.selected_members]
                              let uniqueUsernames = [...formData.selected_member_usernames]
                              
                              // إضافة IDs المباشرة
                              if (newIds.length > 0) {
                                uniqueIds = [...new Set([...formData.selected_members, ...newIds])]
                                setManualMemberIds([...new Set([...manualMemberIds, ...newIds])])
                              }
                              
                              // حفظ usernames غير المحلولة
                              if (unresolvedUsernames.length > 0) {
                                uniqueUsernames = [...new Set([...formData.selected_member_usernames, ...unresolvedUsernames])]
                              }
                              
                              // تحديث formData مرة واحدة
                              setFormData({
                                ...formData,
                                selected_members: uniqueIds,
                                selected_member_usernames: uniqueUsernames
                              })
                              
                              // رسالة النجاح
                              if (unresolvedUsernames.length > 0 && newIds.length > 0) {
                                setSuccess(`تم إضافة ${newIds.length} عضو و ${unresolvedUsernames.length} username`)
                              } else if (unresolvedUsernames.length > 0) {
                                setSuccess(`تم إضافة ${unresolvedUsernames.length} username`)
                              } else {
                                setSuccess(`تم إضافة ${newIds.length} عضو بنجاح`)
                              }
                              
                              setManualMemberUsernames('')
                              
                              // إخفاء رسالة النجاح بعد 3 ثواني
                              setTimeout(() => setSuccess(''), 3000)
                            } else {
                              setError('لم يتم العثور على أي عضو. تأكد من صحة الـ IDs أو usernames')
                            }
                          }}
                          className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
                        >
                          إضافة
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        يمكنك إدخال usernames مثل @user1 أو IDs مثل 123456789 (مفصولة بمسافات)
                      </p>
                    </div>

                    {/* اختيار المجموعة لجلب أعضائها */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        أو اختر مجموعة لاستخراج الأعضاء منها
                      </label>
                      <select
                        value={selectedGroupForMembers}
                        onChange={(e) => {
                          setSelectedGroupForMembers(e.target.value)
                          if (e.target.value) {
                            fetchMembersFromGroup(e.target.value)
                          } else {
                            setMembers([])
                            setFilteredMembers([])
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      >
                        <option value="">-- اختر مجموعة --</option>
                        {groups.map((group) => {
                          const groupId = group.group_id || group.telegram_group_id || Number(group.id)
                          return (
                            <option key={group.id} value={groupId}>
                              {group.title} ({group.members_count.toLocaleString()} عضو)
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    {/* قائمة الأعضاء */}
                    {(selectedGroupForMembers || manualMemberIds.length > 0) && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          الأعضاء المحددون ({formData.selected_members.length + formData.selected_member_usernames.length} محدد) *
                        </label>
                        
                        {/* الأعضاء المضافة يدوياً (IDs) */}
                        {manualMemberIds.length > 0 && manualMemberIds.some(id => formData.selected_members.includes(id)) && (
                          <div className="mb-4 space-y-2">
                            {manualMemberIds.map((memberId) => {
                              if (formData.selected_members.includes(memberId)) {
                                const foundMember = members.find(m => m.telegram_user_id === memberId)
                                
                                if (!foundMember) {
                                  // عضو مضافة يدوياً (غير موجود في القائمة)
                                  return (
                                    <div
                                      key={`manual-member-${memberId}`}
                                      className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200"
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={true}
                                          onChange={(e) => {
                                            if (!e.target.checked) {
                                              setFormData({
                                                ...formData,
                                                selected_members: formData.selected_members.filter(id => id !== memberId)
                                              })
                                              setManualMemberIds(manualMemberIds.filter(id => id !== memberId))
                                            }
                                          }}
                                          className="w-5 h-5 text-orange-600 rounded"
                                        />
                                        <div>
                                          <div className="font-medium text-gray-900">ID: {memberId}</div>
                                          <div className="text-xs text-blue-600">مضاف يدوياً</div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            selected_members: formData.selected_members.filter(id => id !== memberId)
                                          })
                                          setManualMemberIds(manualMemberIds.filter(id => id !== memberId))
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )
                                }
                              }
                              return null
                            })}
                          </div>
                        )}
                        
                        {/* الأعضاء المضافة يدوياً (Usernames) */}
                        {formData.selected_member_usernames.length > 0 && (
                          <div className="mb-4 space-y-2">
                            {formData.selected_member_usernames.map((username) => (
                              <div
                                key={`manual-member-username-${username}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200"
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={true}
                                    onChange={(e) => {
                                      if (!e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          selected_member_usernames: formData.selected_member_usernames.filter(u => u !== username)
                                        })
                                      }
                                    }}
                                    className="w-5 h-5 text-orange-600 rounded"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">@{username}</div>
                                    <div className="text-xs text-purple-600">username مضاف يدوياً</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      selected_member_usernames: formData.selected_member_usernames.filter(u => u !== username)
                                    })
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* قائمة الأعضاء من المجموعة */}
                        {selectedGroupForMembers && (
                          <div>
                            {loadingMembers ? (
                              <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
                                <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">جاري جلب الأعضاء...</p>
                              </div>
                            ) : filteredMembers.length === 0 ? (
                              <div className="border-2 border-gray-200 rounded-xl p-4 text-center">
                                <p className="text-gray-500 text-sm">
                                  لا توجد أعضاء في هذه المجموعة. استخرج الأعضاء أولاً من صفحة استخراج الأعضاء.
                                </p>
                              </div>
                            ) : (
                              <div className="max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 space-y-2">
                                {/* زر تحديد الكل */}
                                <div className="flex items-center justify-between p-2 border-b border-gray-200 mb-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (formData.selected_members.length === filteredMembers.length) {
                                        setFormData({ ...formData, selected_members: [] })
                                      } else {
                                        setFormData({ 
                                          ...formData, 
                                          selected_members: filteredMembers.map(m => m.telegram_user_id)
                                        })
                                      }
                                    }}
                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                  >
                                    {formData.selected_members.length === filteredMembers.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                                  </button>
                                  <span className="text-xs text-gray-500">
                                    {filteredMembers.length} عضو متاح
                                  </span>
                                </div>
                                
                                {filteredMembers.map((member) => (
                                  <label
                                    key={member.id}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.selected_members.includes(member.telegram_user_id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setFormData({
                                            ...formData,
                                            selected_members: [...formData.selected_members, member.telegram_user_id]
                                          })
                                        } else {
                                          setFormData({
                                            ...formData,
                                            selected_members: formData.selected_members.filter(id => id !== member.telegram_user_id)
                                          })
                                        }
                                      }}
                                      className="w-5 h-5 text-orange-600 rounded"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {member.first_name || member.username || 'بدون اسم'}
                                        {member.last_name && ` ${member.last_name}`}
                                        {member.is_bot && <span className="text-xs text-blue-600 mr-2">(بوت)</span>}
                                        {member.is_premium && <span className="text-xs text-yellow-600 mr-2">(Premium)</span>}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {member.username && `@${member.username} • `}
                                        ID: {member.telegram_user_id}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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

              {/* Advanced Settings - Different for Groups vs Members */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">
                  {formData.campaign_type === 'groups' ? 'إعدادات المجموعات' : 
                   formData.campaign_type === 'members' ? 'إعدادات الأعضاء' : 
                   'إعدادات متقدمة'}
                </h4>
                
                {/* Settings specific to Groups - Only show when campaign_type is groups */}
                {formData.campaign_type === 'groups' && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-green-900">إعدادات خاصة بالمجموعات</h5>
                    
                    {/* Delay Settings for Groups */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          التأخير بين المجموعات (ثانية)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.delay_between_messages_min}
                          onChange={(e) => setFormData({ ...formData, delay_between_messages_min: parseInt(e.target.value) || 30 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">التأخير بين إرسال رسالة لكل مجموعة</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          الحد الأقصى للتأخير (ثانية)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.delay_between_messages_max}
                          onChange={(e) => setFormData({ ...formData, delay_between_messages_max: parseInt(e.target.value) || 90 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">الحد الأقصى للتأخير بين المجموعات</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        عدد الرسائل لكل مجموعة
                      </label>
                      <input
                        type="number"
                        min="1"
                        value="1"
                        disabled
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">رسالة واحدة لكل مجموعة (افتراضي)</p>
                    </div>
                    
                    {/* Message Options for Groups */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">خيارات الرسائل</label>
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
                )}

                {/* Settings specific to Members - Only show when campaign_type is members */}
                {formData.campaign_type === 'members' && (
                  <>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-blue-900">إعدادات خاصة بالأعضاء</h5>
                      
                      {/* Delay Settings for Members */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            التأخير بين الأعضاء (ثانية)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.delay_between_messages_min}
                            onChange={(e) => setFormData({ ...formData, delay_between_messages_min: parseInt(e.target.value) || 30 })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">التأخير بين إرسال رسالة لكل عضو (مهم لتجنب الحظر)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            الحد الأقصى للتأخير (ثانية)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.delay_between_messages_max}
                            onChange={(e) => setFormData({ ...formData, delay_between_messages_max: parseInt(e.target.value) || 90 })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">يُنصح بـ 30-90 ثانية للأعضاء</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            عدد الأعضاء في كل دفعة
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={formData.max_messages_per_session}
                            onChange={(e) => setFormData({ ...formData, max_messages_per_session: parseInt(e.target.value) || 10 })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">عدد الرسائل في كل دفعة إرسال (يُنصح بـ 10-20)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            الحد الأقصى يومياً
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.max_messages_per_day}
                            onChange={(e) => setFormData({ ...formData, max_messages_per_day: parseInt(e.target.value) || 200 })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">الحد الأقصى لعدد الرسائل في اليوم</p>
                        </div>
                      </div>
                    </div>

                    {/* Filters - Only for Members */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">خيارات الاستبعاد (للأعضاء فقط)</label>
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
                            checked={formData.exclude_verified}
                            onChange={(e) => setFormData({ ...formData, exclude_verified: e.target.checked })}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span className="text-sm text-gray-700">استبعاد Verified</span>
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

                    {/* Message Options for Members */}
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
                  </>
                )}

                {/* Settings for Mixed Campaigns */}
                {formData.campaign_type === 'mixed' && (
                  <>
                    {/* Delay Settings - Always shown for mixed */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          الحد الأدنى للتأخير (ثانية)
                        </label>
                        <input
                          type="number"
                          min="1"
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
                          min="1"
                          value={formData.delay_between_messages_max}
                          onChange={(e) => setFormData({ ...formData, delay_between_messages_max: parseInt(e.target.value) || 90 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Message Options for Mixed */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">خيارات الرسائل</label>
                      <label className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.personalize_messages}
                          onChange={(e) => setFormData({ ...formData, personalize_messages: e.target.checked })}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className="text-sm text-gray-700">تخصيص الرسائل بالاسم (للأعضاء فقط)</span>
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
                  </>
                )}
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
