'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Send, 
  Users, 
  KeyRound, 
  UserPlus, 
  MessageSquare, 
  ArrowRightLeft,
  ArrowUp,
  Activity,
  Clock,
  Target,
} from 'lucide-react'
import Link from 'next/link'

interface TelegramStats {
  totalSessions: number
  activeSessions: number
  totalGroups: number
  totalMembers: number
  recentActivity: {
    id: string
    type: string
    description: string
    timestamp: string
  }[]
}

export default function TelegramHome() {
  const [stats, setStats] = useState<TelegramStats>({
    totalSessions: 0,
    activeSessions: 0,
    totalGroups: 0,
    totalMembers: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // جلب إحصائيات الجلسات
      const { data: sessions } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('user_id', user.id)

      const totalSessions = sessions?.length || 0
      const activeSessions = sessions?.filter(s => s.status === 'active').length || 0

      // جلب إحصائيات المجموعات
      const { data: groups } = await supabase
        .from('telegram_groups')
        .select('*')
        .eq('user_id', user.id)

      const totalGroups = groups?.length || 0
      const totalMembers = groups?.reduce((sum, group) => sum + (group.members_count || 0), 0) || 0

      // النشاط الأخير
      const recentActivity = [
        ...(sessions?.slice(-2).map(s => ({
          id: `session-${s.id}`,
          type: 'session',
          description: `تم إضافة جلسة: ${s.phone_number}`,
          timestamp: s.created_at
        })) || []),
        ...(groups?.slice(-2).map(g => ({
          id: `group-${g.id}`,
          type: 'group',
          description: `تم استخراج مجموعة: ${g.title}`,
          timestamp: g.created_at
        })) || [])
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 4)

      setStats({
        totalSessions,
        activeSessions,
        totalGroups,
        totalMembers,
        recentActivity
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    return `منذ ${diffDays} يوم`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-neutral-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'الجلسات النشطة',
      value: stats.activeSessions,
      total: stats.totalSessions,
      change: stats.totalSessions > 0 ? `${stats.totalSessions} إجمالي` : 'لا توجد جلسات',
      positive: true,
      icon: KeyRound,
      color: 'bg-blue-600',
      href: '/dashboard/telegram/sessions'
    },
    {
      title: 'المجموعات',
      value: stats.totalGroups,
      change: stats.totalGroups > 0 ? 'مستخرجة' : 'ابدأ الآن',
      positive: true,
      icon: Users,
      color: 'bg-purple-600',
      href: '/dashboard/telegram/groups'
    },
    {
      title: 'إجمالي الأعضاء',
      value: stats.totalMembers.toLocaleString(),
      change: stats.totalMembers > 0 ? 'عضو' : 'لا يوجد',
      positive: true,
      icon: UserPlus,
      color: 'bg-green-600',
      href: '/dashboard/telegram/members-extraction'
    },
    {
      title: 'الحملات النشطة',
      value: 0,
      change: 'قريباً',
      positive: true,
      icon: MessageSquare,
      color: 'bg-orange-600',
      href: '/dashboard/telegram/campaigns'
    },
  ]

  const quickActions = [
    {
      title: 'إدارة الجلسات',
      description: 'أضف وأدر حساباتك على تيليجرام',
      icon: '🔑',
      href: '/dashboard/telegram/sessions'
    },
    {
      title: 'استخراج المجموعات',
      description: 'استخرج مجموعات من حساباتك',
      icon: '👥',
      href: '/dashboard/telegram/groups'
    },
    {
      title: 'استخراج الأعضاء',
      description: 'استخرج قائمة أعضاء المجموعات',
      icon: '📋',
      href: '/dashboard/telegram/members-extraction'
    },
    {
      title: 'إدارة الحملات',
      description: 'أنشئ وأدر حملاتك التسويقية',
      icon: '🎯',
      href: '/dashboard/telegram/campaigns'
    },
    {
      title: 'نقل الأعضاء',
      description: 'انقل الأعضاء بين المجموعات',
      icon: '🔄',
      href: '/dashboard/telegram/members-transfer'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Send className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              منصة تيليجرام 📱
            </h1>
          </div>
        </div>
        <p className="text-white/90 text-lg mr-[72px]">
          أدوات احترافية لإدارة حساباتك ومجموعاتك على تيليجرام
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.positive ? 'text-green-600' : 'text-neutral-500'}`}>
                    {stat.positive && <ArrowUp className="w-4 h-4" />}
                    <span className="font-medium">{stat.change}</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-neutral-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-600">{stat.title}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* رسالة الترحيب للمستخدمين الجدد */}
      {stats.totalSessions === 0 && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">
              ابدأ رحلتك مع تيليجرام
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              أضف أول حساب تيليجرام لك وابدأ في استخدام أدواتنا الاحترافية
            </p>
            <Link 
              href="/dashboard/telegram/sessions"
              className="inline-flex items-center gap-2 bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all card-hover"
            >
              <KeyRound className="w-5 h-5" />
              إضافة حساب الآن
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          إجراءات سريعة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 card-hover group">
                <div className="text-4xl mb-3">{action.icon}</div>
                <h4 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {action.title}
                </h4>
                <p className="text-sm text-neutral-600">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* النشاط الأخير */}
      {stats.recentActivity.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            آخر الأنشطة
          </h3>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-4 pb-4 border-b border-neutral-100 last:border-0"
              >
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  activity.type === 'session' ? 'bg-blue-500' : 'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-neutral-900">{activity.description}</p>
                  <p className="text-sm text-neutral-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* روابط سريعة للأقسام */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/telegram/sessions"
          className="bg-gradient-primary p-6 rounded-2xl text-white card-hover group"
        >
          <div className="text-4xl mb-3">🔑</div>
          <h4 className="text-xl font-bold mb-2">إدارة الحسابات</h4>
          <p className="text-white/90 text-sm">أضف وأدر حساباتك على تيليجرام</p>
        </Link>

        <Link
          href="/dashboard/telegram/groups"
          className="bg-gradient-secondary p-6 rounded-2xl text-white card-hover group"
        >
          <div className="text-4xl mb-3">👥</div>
          <h4 className="text-xl font-bold mb-2">المجموعات</h4>
          <p className="text-white/90 text-sm">استخرج وأدر مجموعاتك</p>
        </Link>

        <Link
          href="/dashboard/telegram/campaigns"
          className="bg-gradient-rainbow p-6 rounded-2xl text-white card-hover group"
        >
          <div className="text-4xl mb-3">🎯</div>
          <h4 className="text-xl font-bold mb-2">الحملات</h4>
          <p className="text-white/90 text-sm">أنشئ وأدر حملاتك التسويقية</p>
        </Link>
      </div>
    </div>
  )
}
