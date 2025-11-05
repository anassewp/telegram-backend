'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  FileSpreadsheet,
  Database,
  X,
  Loader2,
  LogIn,
  Trash2
} from 'lucide-react'

interface TelegramGroup {
  id: string
  group_id: number  // الحقل الصحيح من جدول telegram_groups
  title: string
  username: string | null
  members_count: number
  type: string
  session_id: string
}

interface TelegramSession {
  id: string
  session_name: string
  phone: string
  status: string
}

interface GroupWithExtraction extends TelegramGroup {
  extracted_members: number
  last_extraction: string | null
}

export default function MembersExtractionPage() {
  const [mounted, setMounted] = useState(false)
  const [groups, setGroups] = useState<GroupWithExtraction[]>([])
  const [sessions, setSessions] = useState<TelegramSession[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<GroupWithExtraction | null>(null)
  const [selectedSession, setSelectedSession] = useState('')
  const [showExtractModal, setShowExtractModal] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null)
  const [userGroups, setUserGroups] = useState<Set<number>>(new Set()) // مجموعة IDs المجموعات التي المستخدم عضو فيها
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

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

      // جلب عدد الأعضاء المستخرجين لكل مجموعة
      const groupsWithExtraction: GroupWithExtraction[] = await Promise.all(
        (groupsData || []).map(async (group) => {
          // استخدام group_id من جدول telegram_groups
          const groupId = group.group_id

          const { count } = await supabase
            .from('telegram_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('group_id', groupId)

          // جلب آخر تاريخ استخراج (بدون .single() لأن قد لا يوجد سجل)
          const { data: lastExtractionData } = await supabase
            .from('telegram_members')
            .select('extracted_at')
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .order('extracted_at', { ascending: false })
            .limit(1)

          const lastExtraction = lastExtractionData && lastExtractionData.length > 0 
            ? lastExtractionData[0] 
            : null

          return {
            ...group,
            extracted_members: count || 0,
            last_extraction: lastExtraction?.extracted_at || null
          }
        })
      )

      setGroups(groupsWithExtraction)

      // جلب الجلسات
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (sessionsError) throw sessionsError
      setSessions(sessionsData || [])

      // تحديد أول جلسة نشطة
      if (sessionsData && sessionsData.length > 0) {
        setSelectedSession(sessionsData[0].id)
      }

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleExtractMembers = async () => {
    if (!selectedGroup || !selectedSession) {
      setError('الرجاء اختيار مجموعة وجلسة')
      return
    }

    setExtracting(true)
    setError('')
    setSuccess('')
    setExtractionProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // استخراج الأعضاء عبر Edge Function
      const { data, error: extractError } = await supabase.functions.invoke('telegram-extract-members', {
        body: {
          user_id: user.id,
          session_id: selectedSession,
          group_id: selectedGroup.group_id,
          limit: 1000 // حد أقصى 1000 عضو
        }
      })

      clearInterval(progressInterval)
      setExtractionProgress(100)

      if (extractError) throw extractError

      if (data?.error) {
        throw new Error(data.error.message || 'فشل في استخراج الأعضاء')
      }

      const inserted = data?.data?.inserted || 0
      const skipped = data?.data?.skipped || 0

      setSuccess(`تم استخراج ${inserted} عضو بنجاح${skipped > 0 ? ` (تم تخطي ${skipped} عضو موجود مسبقاً)` : ''}`)

      // إعادة تحميل البيانات بعد ثانية
      setTimeout(() => {
        fetchData()
      }, 1000)

    } catch (err: any) {
      console.error('Error extracting members:', err)
      setError(err.message || 'حدث خطأ أثناء استخراج الأعضاء')
      setExtractionProgress(0)
    } finally {
      setExtracting(false)
    }
  }

  const checkUserGroups = async (userId: string, sessionId?: string) => {
    // هذه الوظيفة ستحاول جلب dialogs من جلسة واحدة للتحقق من المجموعات
    // يمكن تحسينها لاحقاً لجلب جميع dialogs من جميع الجلسات
    if (!sessionId) return

    try {
      // يمكن إضافة Edge Function لجلب dialogs، لكن حالياً سنعتمد على محاولة الاستخراج
      // أو يمكننا إضافة flag في قاعدة البيانات
      // الآن سنتركها فارغة وستتم تحديثها عند محاولة الاستخراج
    } catch (err) {
      console.error('Error checking user groups:', err)
    }
  }

  const handleJoinGroup = async (group: GroupWithExtraction) => {
    if (!selectedSession) {
      setError('الرجاء اختيار جلسة أولاً')
      return
    }

    setJoiningGroup(group.id)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      const selectedSessionData = sessions.find(s => s.id === selectedSession)
      if (!selectedSessionData) throw new Error('الجلسة غير موجودة')

      // الانضمام للمجموعة عبر Edge Function
      const { data, error: joinError } = await supabase.functions.invoke('telegram-join-group', {
        body: {
          user_id: user.id,
          session_id: selectedSession,
          group_id: group.group_id,
          username: group.username || null
        }
      })

      if (joinError) throw joinError

      if (data?.error) {
        throw new Error(data.error.message || 'فشل في الانضمام للمجموعة')
      }

      if (data?.data?.success) {
        setSuccess(`تم الانضمام بنجاح إلى: ${data.data.group_title}`)
        // إضافة المجموعة إلى قائمة المجموعات التي المستخدم عضو فيها
        setUserGroups(prev => new Set([...prev, group.group_id]))
        // إعادة تحميل البيانات بعد ثانية
        setTimeout(() => {
          fetchData()
        }, 1000)
      } else {
        throw new Error('فشل في الانضمام للمجموعة')
      }
    } catch (err: any) {
      console.error('Error joining group:', err)
      setError(err.message || 'حدث خطأ أثناء الانضمام للمجموعة')
    } finally {
      setJoiningGroup(null)
    }
  }

  const handleDeleteGroup = async (group: GroupWithExtraction) => {
    if (!confirm(`هل أنت متأكد من حذف المجموعة "${group.title}" وجميع الأعضاء المستخرجين منها؟\n\nسيتم حذف ${group.extracted_members.toLocaleString()} عضو.`)) {
      return
    }

    setDeletingGroup(group.id)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('المستخدم غير مسجل الدخول')

      // أولاً: حذف جميع الأعضاء المرتبطين بهذه المجموعة
      const { error: membersError } = await supabase
        .from('telegram_members')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', group.group_id)

      if (membersError) {
        console.error('Error deleting members:', membersError)
        // نتابع حتى لو فشل حذف الأعضاء (قد لا يكون هناك أعضاء)
      }

      // ثانياً: حذف المجموعة
      const { error: groupError } = await supabase
        .from('telegram_groups')
        .delete()
        .eq('id', group.id)
        .eq('user_id', user.id)

      if (groupError) throw groupError

      setSuccess(`تم حذف المجموعة "${group.title}" وجميع أعضائها بنجاح`)
      
      // إعادة تحميل البيانات بعد ثانية
      setTimeout(() => {
        fetchData()
      }, 1000)
    } catch (err: any) {
      console.error('Error deleting group:', err)
      setError(err.message || 'حدث خطأ أثناء حذف المجموعة')
    } finally {
      setDeletingGroup(null)
    }
  }

  const handleExportCSV = async (group: GroupWithExtraction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // جلب الأعضاء
      const { data: members, error } = await supabase
        .from('telegram_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', group.telegram_group_id || group.group_id)

      if (error) throw error

      if (!members || members.length === 0) {
        alert('لا توجد أعضاء مستخرجين لهذه المجموعة')
        return
      }

      // تحويل إلى CSV
      const headers = ['Telegram ID', 'Username', 'First Name', 'Last Name', 'Phone', 'Is Bot', 'Is Premium', 'Is Verified']
      const rows = members.map(m => [
        m.telegram_user_id,
        m.username || '',
        m.first_name || '',
        m.last_name || '',
        m.phone || '',
        m.is_bot ? 'Yes' : 'No',
        m.is_premium ? 'Yes' : 'No',
        m.is_verified ? 'Yes' : 'No'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // تحميل الملف
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${group.title}_members_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err: any) {
      console.error('Error exporting CSV:', err)
      alert('حدث خطأ أثناء تصدير الملف')
    }
  }

  const filteredGroups = groups.filter(group =>
    group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total_extracted: groups.reduce((sum, g) => sum + g.extracted_members, 0),
    groups_extracted: groups.filter(g => g.extracted_members > 0).length,
    this_week: groups.filter(g => {
      if (!g.last_extraction) return false
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(g.last_extraction) > weekAgo
    }).reduce((sum, g) => sum + g.extracted_members, 0)
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-3" />
          <p className="text-neutral-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" style={{
      animation: 'fadeIn 0.3s ease-out'
    }}>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">استخراج الأعضاء</h1>
              <p className="text-white/90 text-lg mt-1">استخرج أعضاء المجموعات وصدّرهم بصيغ متعددة</p>
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
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <UserPlus className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{stats.total_extracted.toLocaleString()}</div>
            <div className="text-white/80 text-sm">إجمالي الأعضاء المستخرجين</div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <Users className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{stats.groups_extracted}</div>
            <div className="text-white/80 text-sm">مجموعات تم استخراج أعضائها</div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{stats.this_week.toLocaleString()}</div>
            <div className="text-white/80 text-sm">مستخرج هذا الأسبوع</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مجموعة..."
              className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>
          {sessions.length > 0 && (
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors min-w-[200px]"
            >
              <option value="">-- اختر جلسة --</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.session_name} ({session.phone})
                </option>
              ))}
            </select>
          )}
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>تحديث</span>
          </button>
        </div>
        {sessions.length === 0 && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mx-auto mb-2" />
            <p className="text-orange-700 text-sm">لا توجد جلسات نشطة. أضف جلسة من صفحة الجلسات للانضمام للمجموعات.</p>
          </div>
        )}
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">المجموعات المتاحة</h2>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {groups.length === 0 ? 'لا توجد مجموعات' : 'لا توجد نتائج'}
            </h3>
            <p className="text-gray-600 mb-6">
              {groups.length === 0 
                ? 'قم باستيراد المجموعات أولاً من صفحة المجموعات'
                : 'جرب تعديل البحث'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border-2 border-gray-100 hover:border-green-200 hover:shadow-lg transition-all p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{group.title}</h3>
                      {group.type === 'supergroup' && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-lg">
                          سوبر جروب
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {group.username && <span>@{group.username}</span>}
                      {group.username && <span>•</span>}
                      <span>{group.members_count.toLocaleString()} عضو</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {group.extracted_members > 0 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          تم استخراج {group.extracted_members.toLocaleString()} عضو
                        </span>
                        {group.last_extraction && (
                          <span className="text-xs text-gray-500">
                            • {new Date(group.last_extraction).toLocaleDateString('ar-SA')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">لم يتم الاستخراج بعد</span>
                        {!userGroups.has(group.group_id) && group.username && (
                          <span className="text-xs text-purple-600 mr-2">• تحتاج للانضمام أولاً</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {group.extracted_members > 0 && (
                      <button
                        onClick={() => handleExportCSV(group)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>تصدير CSV</span>
                      </button>
                    )}
                    {/* زر الانضمام - يظهر فقط إذا لم يكن المستخدم عضواً في المجموعة */}
                    {!userGroups.has(group.group_id) && group.username && (
                      <button
                        onClick={() => handleJoinGroup(group)}
                        disabled={joiningGroup === group.id || !selectedSession}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg rounded-lg font-medium transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!selectedSession ? 'اختر جلسة أولاً' : 'انضم للمجموعة'}
                      >
                        {joiningGroup === group.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري الانضمام...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>انضمام</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedGroup(group)
                        setShowExtractModal(true)
                        setExtractionProgress(0)
                        setError('')
                        setSuccess('')
                      }}
                      disabled={extracting || (!userGroups.has(group.group_id) && !group.username)}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg rounded-lg font-medium transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!userGroups.has(group.group_id) && !group.username ? 'يجب الانضمام للمجموعة أولاً' : ''}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{group.extracted_members > 0 ? 'إعادة الاستخراج' : 'استخراج الأعضاء'}</span>
                    </button>
                    {/* زر الحذف */}
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      disabled={deletingGroup === group.id}
                      className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="حذف المجموعة وجميع أعضائها"
                    >
                      {deletingGroup === group.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extraction Modal */}
      {showExtractModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8" style={{
            animation: 'slideUp 0.4s ease-out'
          }}>
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">استخراج الأعضاء</h3>
                <p className="text-gray-600">{selectedGroup.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowExtractModal(false)
                  setExtractionProgress(0)
                  setError('')
                }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-700 font-medium">لا توجد جلسات نشطة</p>
                <p className="text-red-600 text-sm mt-1">أضف جلسة من صفحة الجلسات أولاً</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اختر الجلسة
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    disabled={extracting}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:opacity-50"
                  >
                    <option value="">-- اختر جلسة --</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.session_name} ({session.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {extractionProgress > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>التقدم</span>
                      <span>{extractionProgress}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-500 rounded-full"
                        style={{ width: `${extractionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{success}</span>
                  </div>
                )}

                {extractionProgress === 100 ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowExtractModal(false)
                        setExtractionProgress(0)
                        fetchData()
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      تم بنجاح
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowExtractModal(false)
                        setExtractionProgress(0)
                        setError('')
                      }}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                      disabled={extracting}
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleExtractMembers}
                      disabled={extracting || !selectedSession}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري الاستخراج...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          بدء الاستخراج
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
