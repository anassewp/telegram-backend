'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  ArrowRightLeft, 
  Users, 
  ChevronDown,
  Play,
  Settings,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Shield,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface TelegramGroup {
  id: string
  telegram_group_id: number
  title: string
  username: string | null
  members_count: number
  type: string
}

interface TelegramMember {
  id: string
  telegram_user_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
}

interface TelegramSession {
  id: string
  session_name: string
  phone: string
  status: string
}

export default function MembersTransferPage() {
  const [mounted, setMounted] = useState(false)
  const [sourceGroupId, setSourceGroupId] = useState<string>('')
  const [targetGroupId, setTargetGroupId] = useState<string>('')
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [sessions, setSessions] = useState<TelegramSession[]>([])
  const [sourceMembers, setSourceMembers] = useState<TelegramMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [transferProgress, setTransferProgress] = useState(0)

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  useEffect(() => {
    if (sourceGroupId) {
      fetchSourceMembers()
    } else {
      setSourceMembers([])
      setSelectedMembers([])
    }
  }, [sourceGroupId])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

  const fetchSourceMembers = async () => {
    if (!sourceGroupId) return

    setLoadingMembers(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const sourceGroup = groups.find(g => g.id === sourceGroupId)
      if (!sourceGroup) return

      // جلب الأعضاء من المجموعة المصدر
      const { data: membersData, error: membersError } = await supabase
        .from('telegram_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', sourceGroup.telegram_group_id || sourceGroup.group_id)
        .order('first_name')

      if (membersError) throw membersError
      setSourceMembers(membersData || [])

    } catch (err: any) {
      console.error('Error fetching members:', err)
      setError(err.message || 'حدث خطأ في جلب الأعضاء')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleTransfer = async () => {
    if (!sourceGroupId || !targetGroupId || selectedMembers.length === 0) {
      setError('الرجاء اختيار المجموعات والأعضاء')
      return
    }

    if (sessions.length === 0) {
      setError('لا توجد جلسات نشطة. أضف جلسة من صفحة الجلسات أولاً')
      return
    }

    setTransferring(true)
    setError('')
    setSuccess('')
    setTransferProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      const sourceGroup = groups.find(g => g.id === sourceGroupId)
      const targetGroup = groups.find(g => g.id === targetGroupId)

      if (!sourceGroup || !targetGroup) {
        throw new Error('المجموعات غير موجودة')
      }

      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setTransferProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 500)

      // نقل الأعضاء عبر Edge Function
      const { data, error: transferError } = await supabase.functions.invoke('telegram-transfer-members', {
        body: {
          user_id: user.id,
          session_id: sessions[0].id, // استخدام أول جلسة نشطة
          source_group_id: sourceGroup.telegram_group_id || sourceGroup.group_id,
          target_group_id: targetGroup.telegram_group_id || targetGroup.group_id,
          member_ids: selectedMembers
        }
      })

      clearInterval(progressInterval)
      setTransferProgress(100)

      if (transferError) throw transferError

      if (data?.error) {
        throw new Error(data.error.message || 'فشل في نقل الأعضاء')
      }

      const transferred = data?.data?.total_transferred || 0
      const failed = data?.data?.total_failed || 0

      setSuccess(`تم نقل ${transferred} عضو بنجاح${failed > 0 ? ` (فشل نقل ${failed} عضو)` : ''}`)
      setShowConfirmModal(false)

      // إعادة تحميل البيانات بعد ثانية
      setTimeout(() => {
        fetchData()
        if (sourceGroupId) {
          fetchSourceMembers()
        }
        setSelectedMembers([])
      }, 1000)

    } catch (err: any) {
      console.error('Error transferring members:', err)
      setError(err.message || 'حدث خطأ أثناء نقل الأعضاء')
      setTransferProgress(0)
    } finally {
      setTransferring(false)
    }
  }

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedMembers.length === sourceMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(sourceMembers.map(m => m.telegram_user_id))
    }
  }

  const stats = {
    total_transferred: 0, // يمكن حسابها من قاعدة البيانات
    active_tasks: 0,
    success_rate: 0
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-neutral-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  const sourceGroup = groups.find(g => g.id === sourceGroupId)
  const targetGroup = groups.find(g => g.id === targetGroupId)

  return (
    <>
      <div className="space-y-8" style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
              <ArrowRightLeft className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">نقل الأعضاء</h1>
              <p className="text-white/90 text-lg mt-1">انقل الأعضاء بين المجموعات بسهولة وأمان</p>
            </div>
          </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <ArrowRightLeft className="w-8 h-8 mb-3 opacity-90" />
              <div className="text-3xl font-bold mb-1">{stats.total_transferred.toLocaleString()}</div>
            <div className="text-white/80 text-sm">أعضاء تم نقلهم بنجاح</div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <Zap className="w-8 h-8 mb-3 opacity-90" />
              <div className="text-3xl font-bold mb-1">{stats.active_tasks}</div>
            <div className="text-white/80 text-sm">مهمة نقل نشطة</div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
              <div className="text-3xl font-bold mb-1">{stats.success_rate}%</div>
            <div className="text-white/80 text-sm">معدل النجاح</div>
          </div>
        </div>
      </div>

      {/* Transfer Configuration */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">إعداد عملية النقل</h2>
        </div>

          {sessions.length === 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-orange-600" />
                <div>
                  <h3 className="text-lg font-bold text-orange-800">لا توجد جلسات نشطة</h3>
                  <p className="text-orange-700">يجب إضافة جلسة تيليجرام نشطة من صفحة الجلسات أولاً</p>
                </div>
              </div>
            </div>
          )}

        <div className="space-y-6">
          {/* Source Group */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">المجموعة المصدر</label>
            <div className="relative">
              <select
                  value={sourceGroupId}
                  onChange={(e) => {
                    setSourceGroupId(e.target.value)
                    setSelectedMembers([])
                  }}
                className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors appearance-none bg-white"
              >
                <option value="">اختر المجموعة المصدر</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                      {group.title} - {group.members_count.toLocaleString()} عضو
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

            {/* Source Members List */}
            {sourceGroupId && (
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    الأعضاء المتاحة في المجموعة المصدر
                  </label>
                  {sourceMembers.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {selectedMembers.length === sourceMembers.length ? 'إلغاء التحديد' : 'تحديد الكل'}
                    </button>
                  )}
                </div>

                {loadingMembers ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">جاري جلب الأعضاء...</p>
                  </div>
                ) : sourceMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">لا توجد أعضاء مستخرجين لهذه المجموعة</p>
                    <p className="text-xs mt-1">استخرج الأعضاء أولاً من صفحة استخراج الأعضاء</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {sourceMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white cursor-pointer border border-transparent hover:border-indigo-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.telegram_user_id)}
                          onChange={() => toggleMemberSelection(member.telegram_user_id)}
                          className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
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

                {selectedMembers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-indigo-600">{selectedMembers.length}</span> عضو محدد
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* Arrow Indicator */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-xl">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Target Group */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">المجموعة الهدف</label>
            <div className="relative">
              <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors appearance-none bg-white"
              >
                <option value="">اختر المجموعة الهدف</option>
                  {groups
                    .filter(g => g.id !== sourceGroupId)
                    .map((group) => (
                  <option key={group.id} value={group.id}>
                        {group.title} - {group.members_count.toLocaleString()} عضو
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Action Button */}
          <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!sourceGroupId || !targetGroupId || selectedMembers.length === 0 || sessions.length === 0 || transferring}
            className={`
              w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg
              transition-all shadow-lg hover:shadow-xl
                ${!sourceGroupId || !targetGroupId || selectedMembers.length === 0 || sessions.length === 0 || transferring
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:scale-105'
              }
            `}
          >
              {transferring ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>جاري النقل...</span>
                </>
              ) : (
                <>
            <Play className="w-6 h-6" />
                  <span>بدء عملية النقل ({selectedMembers.length} عضو)</span>
                </>
              )}
          </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">تأكيد عملية النقل</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
                    </div>
                    
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">من:</span>
                  <span className="text-gray-700">{sourceGroup?.title}</span>
                      </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">إلى:</span>
                  <span className="text-gray-700">{targetGroup?.title}</span>
                      </div>
                    </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-bold">{selectedMembers.length}</span> عضو سيتم نقلهم
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  قد تستغرق العملية بعض الوقت حسب عدد الأعضاء
                </p>
                  </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {transferProgress > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>التقدم</span>
                    <span>{transferProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 rounded-full"
                      style={{ width: `${transferProgress}%` }}
                    />
          </div>
        </div>
      )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setError('')
                  setTransferProgress(0)
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                disabled={transferring}
              >
                إلغاء
              </button>
            <button
                onClick={handleTransfer}
                disabled={transferring || selectedMembers.length === 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {transferring ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري النقل...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    تأكيد النقل
                  </>
                )}
            </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
