'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  Ban,
  Check,
} from 'lucide-react';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  phone: string;
  avatar_url: string;
  total_points: number;
  role: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editPoints, setEditPoints] = useState(0);
  const [editRole, setEditRole] = useState('user');
  const usersPerPage = 20;

  useEffect(() => {
    checkAdminAccess();
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

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

  const loadUsers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (profilesData) {
        // الحصول على البريد الإلكتروني من auth.users
        const usersWithEmail = await Promise.all(
          profilesData.map(async (profile) => {
            const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
            return {
              ...profile,
              email: authData?.user?.email || 'غير متوفر',
            };
          })
        );

        setUsers(usersWithEmail as UserData[]);
        setFilteredUsers(usersWithEmail as UserData[]);
      }
    } catch (error) {
      console.error('خطأ في تحميل المستخدمين:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // فلترة حسب البحث
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // فلترة حسب الدور
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (user: UserData) => {
    setSelectedUser(user);
    setEditPoints(user.total_points || 0);
    setEditRole(user.role || 'user');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          total_points: editPoints,
          role: editRole,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      alert('تم تحديث بيانات المستخدم بنجاح');
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error);
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم: ${userName}؟`)) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);

      if (error) throw error;

      alert('تم حذف المستخدم بنجاح');
      loadUsers();
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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
            <Users className="w-8 h-8" />
            إدارة المستخدمين
          </h1>
          <p className="text-gray-600 mt-1">إجمالي المستخدمين: {filteredUsers.length}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">جميع الأدوار</option>
                <option value="admin">مسؤول</option>
                <option value="user">مستخدم عادي</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    البريد الإلكتروني
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الشركة
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الدور
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    النقاط
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    تاريخ التسجيل
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.full_name || 'غير محدد'}
                          </p>
                          <p className="text-xs text-gray-500">{user.phone || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.company_name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <Shield className="w-3 h-3" />
                          مسؤول
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <User className="w-3 h-3" />
                          مستخدم
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-primary">
                      {user.total_points || 0} نقطة
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        نشط
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.full_name || user.email)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                عرض {indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)} من{' '}
                {filteredUsers.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">تعديل المستخدم</h2>
                <p className="text-gray-600 mt-1">{selectedUser.full_name || selectedUser.email}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">النقاط</label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="user">مستخدم عادي</option>
                    <option value="admin">مسؤول</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
