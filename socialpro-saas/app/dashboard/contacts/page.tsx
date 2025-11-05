'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Mail,
  Phone,
  Tag,
  MoreVertical,
  UserPlus,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  notes: string;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tags: '',
    notes: '',
  });

  // محاكاة بيانات جهات الاتصال
  const mockContacts: Contact[] = [
    {
      id: '1',
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      phone: '+966501234567',
      tags: ['عميل', 'مهتم'],
      notes: 'عميل محتمل من حملة فيسبوك',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'فاطمة علي',
      email: 'fatima@example.com',
      phone: '+966507654321',
      tags: ['عميل', 'نشط'],
      notes: 'اشترك في الخطة الشهرية',
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'خالد عبدالله',
      email: 'khaled@example.com',
      phone: '+966509876543',
      tags: ['محتمل'],
      notes: 'طلب عرض سعر',
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      // محاكاة تحميل البيانات
      setContacts(mockContacts);
    }
    setLoading(false);
  };

  const allTags = Array.from(
    new Set(contacts.flatMap(c => c.tags))
  );

  const handleAddContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: formData.notes,
      created_at: new Date().toISOString(),
    };

    setContacts([newContact, ...contacts]);
    setShowAddModal(false);
    setFormData({ name: '', email: '', phone: '', tags: '', notes: '' });
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    
    const matchesTag = selectedTag === 'all' || contact.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">جاري تحميل جهات الاتصال...</p>
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
            جهات الاتصال
          </h1>
          <p className="text-neutral-600">
            أدر قاعدة بيانات عملائك وجهات اتصالك
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            استيراد
          </button>
          <button className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 flex items-center gap-2">
            <Download className="w-5 h-5" />
            تصدير
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold btn-transition hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            إضافة جهة اتصال
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">إجمالي جهات الاتصال</span>
            <UserPlus className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-3xl font-bold text-neutral-900">{contacts.length}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">عملاء نشطون</span>
            <Tag className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {contacts.filter(c => c.tags.includes('نشط')).length}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">عملاء محتملون</span>
            <Tag className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {contacts.filter(c => c.tags.includes('محتمل')).length}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-sm">تم الإضافة اليوم</span>
            <Plus className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">0</div>
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
              placeholder="بحث عن جهة اتصال..."
              className="w-full pr-12 pl-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">جميع التصنيفات</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <button className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            المزيد من الفلاتر
          </button>
        </div>
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-16 text-center">
          <UserPlus className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">
            لا توجد جهات اتصال
          </h3>
          <p className="text-neutral-600 mb-6">
            ابدأ بإضافة جهات اتصال جديدة أو استيراد قائمة موجودة
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold btn-transition hover:bg-primary-700"
          >
            إضافة جهة اتصال الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white p-6 rounded-2xl border border-neutral-200 hover:border-primary-500 transition-all card-hover"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">
                    {contact.name}
                  </h3>
                  {contact.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {contact.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button className="p-2 hover:bg-neutral-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <span>{contact.phone}</span>
                </div>
              </div>

              {/* Notes */}
              {contact.notes && (
                <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-700 line-clamp-2">
                    {contact.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-neutral-200">
                <button className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 flex items-center justify-center gap-2 text-sm">
                  <Edit className="w-4 h-4" />
                  تحرير
                </button>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">
              إضافة جهة اتصال جديدة
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  الاسم *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="أحمد محمد"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="ahmed@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="+966501234567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  التصنيفات (افصل بفاصلة)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="عميل, مهتم, نشط"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddContact}
                disabled={!formData.name || !formData.email || !formData.phone}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold btn-transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', email: '', phone: '', tags: '', notes: '' });
                }}
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
