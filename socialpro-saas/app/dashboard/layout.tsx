'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Share2,
  Target,
  Users,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  Shield,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    // جلب بيانات الملف الشخصي
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      const isUserAdmin = profileData.role === 'admin';
      setIsAdmin(isUserAdmin);
      console.log('Dashboard Layout - User Profile:', {
        userId: user.id,
        role: profileData.role,
        isAdmin: isUserAdmin,
        fullName: profileData.full_name,
      });
    } else {
      console.log('Dashboard Layout - No profile data found for user:', user.id);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigation = [
    { name: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
    { name: 'المنصات', href: '/dashboard/platforms', icon: Share2 },
    { name: 'الحملات', href: '/dashboard/campaigns', icon: Target },
    { name: 'جهات الاتصال', href: '/dashboard/contacts', icon: Users },
    { name: 'التقارير', href: '/dashboard/reports', icon: FileText },
    { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
    { name: 'الفوترة', href: '/dashboard/billing', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-white border-l border-neutral-200 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 border-b border-neutral-200 flex items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center space-x-2 space-x-reverse">
            <Image 
              src="/logo.png" 
              alt="SocialPro Logo" 
              width={40} 
              height={40} 
              className="object-contain"
            />
            <span className="text-2xl font-bold text-neutral-900">SocialPro</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-neutral-900 truncate">
                {profile?.full_name || user?.email}
              </div>
              <div className="text-sm text-neutral-600 flex items-center gap-1">
                <span className="text-accent-500">★</span>
                {profile?.points || 100} نقطة
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {/* Admin Link - يظهر فقط للمسؤولين */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all shadow-md hover:shadow-lg group mb-4"
              onClick={() => setSidebarOpen(false)}
            >
              <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold">لوحة الإدارة</span>
            </Link>
          )}
          
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors group"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 right-4 left-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:mr-72">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-neutral-200 sticky top-0 z-40">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-neutral-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="بحث..."
                  className="w-full pr-12 pl-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-neutral-100 rounded-lg">
                <Bell className="w-5 h-5 text-neutral-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
