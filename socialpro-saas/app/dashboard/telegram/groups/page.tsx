'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { importGroups } from '@/lib/telegram-api';
import { 
  Download, 
  Trash2, 
  Users, 
  Calendar,
  X,
  RefreshCw,
  Search,
  MessageCircle,
  TrendingUp,
  Globe,
  Shield,
  Sparkles,
  Filter,
  AlertCircle,
  CheckCircle2,
  Plus,
  Zap,
  ChevronDown,
  Tag,
  Info
} from 'lucide-react';

interface TelegramGroup {
  id: string;
  session_id: string;
  group_id: number;
  title: string;
  username: string | null;
  members_count: number;
  type: 'group' | 'supergroup' | 'channel';
  is_active: boolean;
  has_visible_participants?: boolean;
  members_visible?: boolean;  // هل الأعضاء ظاهرين للجميع
  is_private?: boolean;  // خاصة أو عامة
  is_restricted?: boolean;  // مقيدة
  can_send?: boolean;  // يمكن الإرسال
  is_closed?: boolean;  // مغلقة
  created_at: string;
}

interface TelegramSession {
  id: string;
  session_name: string;
  phone_number: string;
  is_active: boolean;
  api_id: string;
  api_hash: string;
  session_string: string;
}

interface SearchResult {
  id: string;
  title: string;
  username: string | null;
  members_count: number;
  type: 'group' | 'supergroup' | 'channel';
  members_visible?: boolean;  // هل الأعضاء ظاهرين للجميع
  is_private?: boolean;  // خاصة أو عامة
  is_restricted?: boolean;  // مقيدة
  can_send?: boolean;  // يمكن الإرسال
  is_closed?: boolean;  // مغلقة
}

// الكلمات المفتاحية الموسعة للبحث في تيليجرام
const SEARCH_CATEGORIES = [
  {
    name: 'التكنولوجيا والبرمجة',
    icon: '💻',
    keywords: ['برمجة', 'تطوير', 'python', 'javascript', 'AI', 'تعلم الآلة', 'machine learning', 'blockchain', 'web development', 'mobile apps', 'coding', 'software engineering', 'data science', 'deep learning', 'react', 'node.js', 'flutter', 'كورسات برمجة', 'تطوير تطبيقات']
  },
  {
    name: 'الأخبار والإعلام',
    icon: '📰',
    keywords: ['أخبار', 'عاجل', 'news', 'سياسة', 'اقتصاد', 'رياضة', 'breaking news', 'world news', 'كرة قدم', 'أخبار فورية', 'أحداث', 'تغطية مباشرة', 'صحافة', 'إعلام', 'أخبار محلية', 'أخبار دولية', 'تقارير']
  },
  {
    name: 'الأعمال والتجارة',
    icon: '💼',
    keywords: ['أعمال', 'تجارة', 'business', 'startup', 'مشاريع', 'تسويق', 'مبيعات', 'e-commerce', 'تجارة إلكترونية', 'استيراد وتصدير', 'ريادة أعمال', 'إدارة مشاريع', 'استراتيجية', 'نمو', 'شركات ناشئة', 'استثمار تجاري', 'دروبشيبنج']
  },
  {
    name: 'العملات الرقمية',
    icon: '₿',
    keywords: ['crypto', 'bitcoin', 'ethereum', 'trading', 'تداول', 'عملات رقمية', 'blockchain', 'NFT', 'بيتكوين', 'إيثريوم', 'تداول العملات', 'تحليل تقني', 'استثمار', 'binance', 'altcoins', 'DeFi', 'web3', 'توصيات تداول']
  },
  {
    name: 'التعليم والدراسة',
    icon: '📚',
    keywords: ['تعليم', 'دراسة', 'education', 'courses', 'دورات', 'جامعة', 'مذاكرة', 'امتحانات', 'كورسات', 'تعلم', 'شروحات', 'دروس', 'مناهج', 'معلومات تعليمية', 'ثقافة', 'علوم', 'لغات', 'تطوير ذات']
  },
  {
    name: 'التسويق الرقمي',
    icon: '📱',
    keywords: ['تسويق', 'سوشيال ميديا', 'SEO', 'إعلانات', 'digital marketing', 'social media', 'content marketing', 'تسويق إلكتروني', 'إعلانات ممولة', 'فيسبوك أدز', 'جوجل أدز', 'تسويق بالمحتوى', 'influencer marketing', 'نمو', 'كتابة إعلانية', 'برامج تسويقية']
  },
  {
    name: 'ريادة الأعمال',
    icon: '🚀',
    keywords: ['ريادة', 'entrepreneurship', 'startup', 'مشاريع صغيرة', 'استثمار', 'تمويل', 'business ideas', 'أفكار مشاريع', 'رواد أعمال', 'تطوير أعمال', 'نمو', 'scale', 'pitch', 'مستثمرون', 'رأس مال', 'شركات ناشئة', 'innovation']
  },
  {
    name: 'الصحة واللياقة',
    icon: '💪',
    keywords: ['صحة', 'رياضة', 'fitness', 'gym', 'تغذية', 'diet', 'wellness', 'workout', 'تمارين', 'كمال أجسام', 'لياقة بدنية', 'رجيم', 'خسارة وزن', 'بناء عضلات', 'يوجا', 'تمارين منزلية', 'تدريب', 'صحة نفسية']
  },
  {
    name: 'الطبخ والطعام',
    icon: '🍳',
    keywords: ['طبخ', 'وصفات', 'cooking', 'food', 'أكل', 'حلويات', 'مطبخ', 'recipes', 'وصفات سهلة', 'معجنات', 'مأكولات', 'طبخات', 'أكلات شعبية', 'مطاعم', 'طهي', 'مخبوزات', 'طبخ عربي', 'طبخ عالمي']
  },
  {
    name: 'السفر والسياحة',
    icon: '✈️',
    keywords: ['سفر', 'سياحة', 'travel', 'tourism', 'رحلات', 'فنادق', 'flights', 'destinations', 'سياحة', 'مغامرات', 'عروض سفر', 'تذاكر', 'حجوزات', 'أماكن سياحية', 'travel vlog', 'استكشاف', 'سياحة عربية', 'سياحة عالمية']
  },
  {
    name: 'التصوير والفن',
    icon: '📸',
    keywords: ['تصوير', 'photography', 'فن', 'art', 'تصميم', 'design', 'creative', 'graphics', 'تصوير فوتوغرافي', 'موشن جرافيك', 'رسم', 'فن رقمي', 'تصميم جرافيك', 'إبداع', 'فنون تشكيلية', 'photoshop', 'illustrator', 'فن معاصر']
  },
  {
    name: 'الترفيه والميمز',
    icon: '😂',
    keywords: ['memes', 'ميمز', 'ترفيه', 'فكاهة', 'نكت', 'entertainment', 'funny', 'comedy', 'كوميديا', 'ضحك', 'فيديوهات مضحكة', 'تسلية', 'مرح', 'نكت عربية', 'ميمز عربية', 'فيديوهات ترفيهية', 'لحظات مضحكة']
  },
  {
    name: 'الألعاب',
    icon: '🎮',
    keywords: ['ألعاب', 'gaming', 'games', 'esports', 'بلايستيشن', 'xbox', 'mobile games', 'fortnite', 'pubg', 'call of duty', 'fifa', 'gamer', 'gameplay', 'streaming', 'twitch', 'ألعاب موبايل', 'ألعاب فيديو', 'منافسات']
  },
  {
    name: 'الموضة والأزياء',
    icon: '👗',
    keywords: ['موضة', 'fashion', 'أزياء', 'style', 'ملابس', 'اكسسوارات', 'trends', 'beauty', 'جمال', 'مكياج', 'عناية بالبشرة', 'عطور', 'ماركات', 'تسوق', 'أناقة', 'موضة عصرية', 'أحدث صيحات', 'ستايل']
  },
  {
    name: 'التقنية والجوالات',
    icon: '📱',
    keywords: ['موبايل', 'smartphones', 'تقنية', 'tech', 'هواتف', 'gadgets', 'reviews', 'iphone', 'android', 'samsung', 'هواتف ذكية', 'تطبيقات', 'أجهزة ذكية', 'تقنية حديثة', 'مراجعات تقنية', 'أخبار تقنية', 'نصائح تقنية']
  }
];

export default function TelegramGroupsPage() {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<TelegramGroup[]>([]);
  const [sessions, setSessions] = useState<TelegramSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [activeSessionFilter, setActiveSessionFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  
  // Search Results
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filteredSearchResults, setFilteredSearchResults] = useState<SearchResult[]>([]);
  const [selectedSearchResults, setSelectedSearchResults] = useState<string[]>([]);
  
  // Filters for imported groups
  const [filterType, setFilterType] = useState<'all' | 'groups_only' | 'group' | 'supergroup' | 'channel'>('all');
  const [filterVisibleMembers, setFilterVisibleMembers] = useState<'all' | 'visible' | 'hidden'>('all');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'public' | 'private'>('all');
  const [filterCanSend, setFilterCanSend] = useState<'all' | 'yes' | 'no'>('all');
  const [filterRestricted, setFilterRestricted] = useState<'all' | 'yes' | 'no'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  // Filters for search results
  const [searchFilterVisibleMembers, setSearchFilterVisibleMembers] = useState<'all' | 'visible' | 'hidden'>('all');
  const [searchFilterPrivacy, setSearchFilterPrivacy] = useState<'all' | 'public' | 'private'>('all');
  const [searchFilterCanSend, setSearchFilterCanSend] = useState<'all' | 'yes' | 'no'>('all');
  const [searchFilterRestricted, setSearchFilterRestricted] = useState<'all' | 'yes' | 'no'>('all');
  const [showSearchFilters, setShowSearchFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [groups, searchQuery, filterType, filterVisibleMembers, filterPrivacy, filterCanSend, filterRestricted, activeSessionFilter]);

  // فلترة نتائج البحث
  useEffect(() => {
    if (searchResults.length === 0) {
      setFilteredSearchResults([]);
      return;
    }

    let filtered = [...searchResults];

    // Filter by visible members
    if (searchFilterVisibleMembers === 'visible') {
      filtered = filtered.filter(group => {
        // إذا كان الحقل موجود، استخدمه
        if (group.members_visible !== undefined) {
          return group.members_visible === true;
        }
        // إذا لم يكن موجود، نعتبره ظاهر (افتراضي)
        return true;
      });
    } else if (searchFilterVisibleMembers === 'hidden') {
      filtered = filtered.filter(group => {
        // فقط إذا كان الحقل موجود و false
        return group.members_visible === false;
      });
    }

    // Filter by privacy
    if (searchFilterPrivacy === 'public') {
      filtered = filtered.filter(group => {
        if (group.is_private !== undefined) {
          return group.is_private === false;
        }
        // إذا لم يكن موجود، نستخدم username كدليل
        return group.username !== null && group.username !== '';
      });
    } else if (searchFilterPrivacy === 'private') {
      filtered = filtered.filter(group => {
        if (group.is_private !== undefined) {
          return group.is_private === true;
        }
        // إذا لم يكن موجود، نستخدم username كدليل
        return !group.username || group.username === '';
      });
    }

    // Filter by can send
    if (searchFilterCanSend === 'yes') {
      filtered = filtered.filter(group => {
        if (group.can_send !== undefined) {
          return group.can_send === true;
        }
        // إذا لم يكن موجود، نعتبره يمكن الإرسال إذا لم يكن مغلق
        return group.is_closed !== true;
      });
    } else if (searchFilterCanSend === 'no') {
      filtered = filtered.filter(group => {
        if (group.can_send !== undefined) {
          return group.can_send === false;
        }
        // إذا لم يكن موجود، نعتبره مغلق إذا كان is_closed = true
        return group.is_closed === true;
      });
    }

    // Filter by restricted
    if (searchFilterRestricted === 'yes') {
      filtered = filtered.filter(group => group.is_restricted === true);
    } else if (searchFilterRestricted === 'no') {
      filtered = filtered.filter(group => 
        group.is_restricted === false || 
        group.is_restricted === undefined
      );
    }

    console.log('🔍 Filtered search results:', {
      total: searchResults.length,
      filtered: filtered.length,
      filters: {
        visibleMembers: searchFilterVisibleMembers,
        privacy: searchFilterPrivacy,
        canSend: searchFilterCanSend,
        restricted: searchFilterRestricted
      }
    });

    setFilteredSearchResults(filtered);
  }, [searchResults, searchFilterVisibleMembers, searchFilterPrivacy, searchFilterCanSend, searchFilterRestricted]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: groupsData, error: groupsError } = await supabase
        .from('telegram_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...groups];

    // Filter by active session
    if (activeSessionFilter !== 'all') {
      filtered = filtered.filter(group => group.session_id === activeSessionFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(group => 
        group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType === 'groups_only') {
      filtered = filtered.filter(group => group.type === 'group' || group.type === 'supergroup');
    } else if (filterType !== 'all') {
      filtered = filtered.filter(group => group.type === filterType);
    }

    // Filter by visible members (استخدام members_visible الجديد أولاً، ثم has_visible_participants للتوافق)
    if (filterVisibleMembers === 'visible') {
      filtered = filtered.filter(group => 
        group.members_visible === true || 
        (group.members_visible === undefined && group.has_visible_participants === true)
      );
    } else if (filterVisibleMembers === 'hidden') {
      filtered = filtered.filter(group => 
        group.members_visible === false || 
        (group.members_visible === undefined && group.has_visible_participants === false)
      );
    }

    // Filter by privacy (خاصة/عامة)
    if (filterPrivacy === 'public') {
      filtered = filtered.filter(group => 
        group.is_private === false || 
        (group.is_private === undefined && group.username !== null)
      );
    } else if (filterPrivacy === 'private') {
      filtered = filtered.filter(group => 
        group.is_private === true || 
        (group.is_private === undefined && group.username === null)
      );
    }

    // Filter by can send (يمكن الإرسال)
    if (filterCanSend === 'yes') {
      filtered = filtered.filter(group => 
        group.can_send === true || 
        (group.can_send === undefined && group.is_closed !== true)
      );
    } else if (filterCanSend === 'no') {
      filtered = filtered.filter(group => 
        group.can_send === false || 
        group.is_closed === true ||
        (group.can_send === undefined && group.is_closed === true)
      );
    }

    // Filter by restricted (مقيدة)
    if (filterRestricted === 'yes') {
      filtered = filtered.filter(group => group.is_restricted === true);
    } else if (filterRestricted === 'no') {
      filtered = filtered.filter(group => 
        group.is_restricted === false || 
        group.is_restricted === undefined
      );
    }

    setFilteredGroups(filtered);
  };

  const handleImportGroups = async () => {
    if (!selectedSessionId) {
      setError('الرجاء اختيار جلسة');
      return;
    }

    setImporting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      const selectedSession = sessions.find(s => s.id === selectedSessionId);
      if (!selectedSession) throw new Error('الجلسة غير موجودة');

      // استخدام Edge Function لاستيراد المجموعات
      const { data, error } = await supabase.functions.invoke('telegram-import-groups-from-session', {
        body: {
          session_id: selectedSession.id,
          user_id: user.id,
          api_id: selectedSession.api_id,
          api_hash: selectedSession.api_hash,
          session_string: selectedSession.session_string
        }
      });

      if (error) {
        console.error('خطأ في الاستيراد:', error);
        // عرض رسالة خطأ أكثر تفصيلاً
        const errorMessage = error.message || 'فشل الاستيراد';
        throw new Error(`فشل الاستيراد: ${errorMessage}`);
      }

      // التحقق من وجود error في response
      if (data?.error) {
        console.error('خطأ من Edge Function:', data.error);
        throw new Error(data.error.message || 'حدث خطأ أثناء الاستيراد');
      }

      if (data?.success) {
        setShowImportModal(false);
        fetchData();
        alert(`تم استيراد ${data.total || data.groups?.length || 0} مجموعة بنجاح`);
      } else {
        // إذا لم يكن هناك success ولا error، قد يكون هناك مشكلة في الـ response
        console.error('Response غير متوقع:', data);
        throw new Error('استجابة غير متوقعة من Edge Function');
      }
    } catch (err: any) {
      console.error('خطأ في الاستيراد:', err);
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setImporting(false);
    }
  };

  const handleSearchGroups = async () => {
    if (!selectedSessionId) {
      setError('الرجاء اختيار جلسة للبحث');
      return;
    }

    const searchKeyword = customKeyword || (selectedCategory ? 
      SEARCH_CATEGORIES.find(c => c.name === selectedCategory)?.keywords[0] : '');

    if (!searchKeyword) {
      setError('الرجاء اختيار تصنيف أو إدخال كلمة مفتاحية');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      const selectedSession = sessions.find(s => s.id === selectedSessionId);
      if (!selectedSession) throw new Error('الجلسة غير موجودة');

      // البحث العالمي في Telegram باستخدام Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-search-groups', {
        body: {
          query: searchKeyword,
          limit: 20,
          offset: 0,
          session_id: selectedSession.id,
          user_id: user.id,
          api_id: selectedSession.api_id,
          api_hash: selectedSession.api_hash,
          session_string: selectedSession.session_string
        }
      });

      if (error) {
        console.error('خطأ في البحث:', error);
        throw new Error(`فشل البحث: ${error.message}`);
      }

      if (data?.data?.groups && Array.isArray(data.data.groups)) {
        // تحويل البيانات من الـ API إلى التنسيق المتوقع
        const realResults: SearchResult[] = data.data.groups.map((group: any) => ({
          id: String(group.id || group.group_id || Math.random().toString(36).substr(2, 9)),
          title: group.title || 'Unknown',
          username: group.username || null,
          members_count: group.members_count || 0,
          type: group.type === 'channel' ? 'channel' : 
                group.type === 'supergroup' ? 'supergroup' : 'group',
          // الحقول الجديدة للفلترة
          members_visible: group.members_visible !== undefined ? group.members_visible : true,
          is_private: group.is_private !== undefined ? group.is_private : false,
          is_restricted: group.is_restricted !== undefined ? group.is_restricted : false,
          can_send: group.can_send !== undefined ? group.can_send : true,
          is_closed: group.is_closed !== undefined ? group.is_closed : false
        }));

        setSearchResults(realResults);
        setFilteredSearchResults(realResults);
        setSelectedSearchResults([]);
        setShowSearchModal(false);
        setShowSearchResults(true);
        
        // إشعار المستخدم بالنتيجة
        const totalResults = data.data.total || realResults.length;
        console.log(`تم العثور على ${totalResults} مجموعة للبحث: "${searchKeyword}"`);
      } else {
        throw new Error('لم يتم العثور على نتائج');
      }
    } catch (err: any) {
      console.error('خطأ في البحث:', err);
      setError(err.message || 'حدث خطأ أثناء البحث');
    } finally {
      setSearching(false);
    }
  };

  const handleImportSelectedResults = async () => {
    if (selectedSearchResults.length === 0) {
      alert('الرجاء تحديد مجموعات للاستيراد');
      return;
    }

    setImporting(true);
    
    try {
      // الحصول على بيانات المستخدم
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // الحصول على المجموعات المحددة من نتائج البحث
      const selectedGroups = searchResults.filter(group => 
        selectedSearchResults.includes(group.id)
      );

      if (selectedGroups.length === 0) {
        throw new Error('لا توجد مجموعات محددة للاستيراد');
      }

      // تحضير البيانات للاستيراد
      const groupsToImport = selectedGroups.map(group => ({
        id: group.id,
        title: group.title,
        username: group.username,
        type: group.type,
        description: `مجموعة مستوردة من البحث: ${group.title}`,
        members_count: group.members_count,
        photo_url: group.username ? `https://t.me/${group.username}` : '',
        is_public: true,
        verified: false,
        invite_link: group.username ? `https://t.me/${group.username}` : '',
        language: 'ar', // اللغة الافتراضية
        region: 'Arab',
        category: 'Imported'
      }));

      // استيراد المجموعات باستخدام Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-import-groups', {
        body: {
          user_id: user.id,
          groups: groupsToImport
        }
      });

      if (error) {
        console.error('خطأ في الاستيراد:', error);
        throw new Error(`فشل في الاستيراد: ${error.message}`);
      }

      if (data?.data) {
        const importedCount = data.data.total_imported || 0;
        
        // إغلاق النافذة وإعادة تحميل البيانات
        setShowSearchResults(false);
        setSearchResults([]);
        setSelectedSearchResults([]);
        fetchData();
        
        // عرض رسالة نجاح
        alert(`تم استيراد ${importedCount} مجموعة بنجاح!`);
        
        console.log('تفاصيل الاستيراد:', data.data.import_summary);
      } else {
        throw new Error('لم يتم إرجاع بيانات الاستيراد');
      }
    } catch (err: any) {
      console.error('خطأ في الاستيراد:', err);
      setError(err.message || 'حدث خطأ أثناء الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedGroups.length === 0) {
      alert('الرجاء اختيار مجموعات للحذف');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف ${selectedGroups.length} مجموعة؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('telegram_groups')
        .delete()
        .in('id', selectedGroups);

      if (error) throw error;

      setSelectedGroups([]);
      fetchData();
      alert('تم الحذف بنجاح');
    } catch (err) {
      console.error('Error deleting groups:', err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleDeleteAll = async () => {
    if (groups.length === 0) return;

    if (!confirm(`هل أنت متأكد من حذف جميع المجموعات (${groups.length} مجموعة)؟ هذا الإجراء لا يمكن التراجع عنه!`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('telegram_groups')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setGroups([]);
      setFilteredGroups([]);
      setSelectedGroups([]);
      alert('تم حذف جميع المجموعات بنجاح');
    } catch (err) {
      console.error('Error deleting all groups:', err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map(g => g.id));
    }
  };

  const toggleSearchResultSelection = (resultId: string) => {
    setSelectedSearchResults(prev => 
      prev.includes(resultId) 
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    );
  };

  const toggleSelectAllSearchResults = () => {
    if (selectedSearchResults.length === filteredSearchResults.length) {
      setSelectedSearchResults([]);
    } else {
      setSelectedSearchResults(filteredSearchResults.map(r => r.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-neutral-600">جاري تحميل المجموعات...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: groups.length,
    groups: groups.filter(g => g.type === 'group' || g.type === 'supergroup').length,
    channels: groups.filter(g => g.type === 'channel').length,
    visibleMembers: groups.filter(g => g.has_visible_participants === true).length,
    totalMembers: groups.reduce((sum, g) => sum + (g.members_count || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header with Session Selector */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">المجموعات والقنوات</h1>
              <p className="text-neutral-600">إدارة مجموعاتك المستوردة من تيليجرام</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              بحث متقدم
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              استيراد مجموعاتي
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
            <div className="text-sm text-neutral-600">إجمالي</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.groups}</div>
            <div className="text-sm text-neutral-600">مجموعات</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.channels}</div>
            <div className="text-sm text-neutral-600">قنوات</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{stats.visibleMembers}</div>
            <div className="text-sm text-neutral-600">أعضاء ظاهرين</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.totalMembers.toLocaleString()}</div>
            <div className="text-sm text-neutral-600">مجموع الأعضاء</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-600" />
            <h3 className="font-bold text-neutral-900">الفلاتر والبحث</h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            {showFilters ? 'إخفاء الفلاتر المتقدمة' : 'إظهار الفلاتر المتقدمة'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">البحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مجموعة..."
                className="w-full pr-10 pl-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">النوع</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">الكل</option>
              <option value="groups_only">مجموعات فقط (بدون قنوات)</option>
              <option value="group">مجموعة</option>
              <option value="supergroup">مجموعة كبيرة</option>
              <option value="channel">قناة</option>
            </select>
          </div>

          {/* Visible Members Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">ظهور الأعضاء</label>
            <select
              value={filterVisibleMembers}
              onChange={(e) => setFilterVisibleMembers(e.target.value as any)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">الكل</option>
              <option value="visible">أعضاء ظاهرين</option>
              <option value="hidden">أعضاء مخفيين (إدمن فقط)</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Privacy Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">النوع (خاصة/عامة)</label>
              <select
                value={filterPrivacy}
                onChange={(e) => setFilterPrivacy(e.target.value as any)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">الكل</option>
                <option value="public">عامة (لها username)</option>
                <option value="private">خاصة (بدون username)</option>
              </select>
            </div>

            {/* Can Send Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">يمكن الإرسال</label>
              <select
                value={filterCanSend}
                onChange={(e) => setFilterCanSend(e.target.value as any)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">الكل</option>
                <option value="yes">يمكن الإرسال</option>
                <option value="no">مغلقة/لا يمكن الإرسال</option>
              </select>
            </div>

            {/* Restricted Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">مقيدة</label>
              <select
                value={filterRestricted}
                onChange={(e) => setFilterRestricted(e.target.value as any)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">الكل</option>
                <option value="no">غير مقيدة</option>
                <option value="yes">مقيدة</option>
              </select>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {filteredGroups.length > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-200">
            <button
              onClick={toggleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {selectedGroups.length === filteredGroups.length ? 'إلغاء التحديد' : 'تحديد الكل'}
            </button>
            
            {selectedGroups.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-600">
                  {selectedGroups.length} محدد
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف المحدد
                </button>
              </div>
            )}

            <div className="mr-auto">
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                حذف الكل ({groups.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Session Selector - في الأسفل لسهولة الوصول */}
      {sessions.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
          <label className="block text-base font-bold text-blue-800 mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold">اختر الجلسة للعرض</span>
            </div>
          </label>
          <div className="relative">
            <select
              value={activeSessionFilter}
              onChange={(e) => setActiveSessionFilter(e.target.value)}
              className="w-full px-6 py-4 pr-12 border-3 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-600 bg-white appearance-none cursor-pointer text-lg font-semibold shadow-sm hover:border-blue-500 transition-colors"
              style={{ minHeight: '56px' }}
            >
              <option value="all">
                🔵 جميع الجلسات ({groups.length} مجموعة)
              </option>
              {sessions.map((session) => {
                const sessionGroups = groups.filter(g => g.session_id === session.id);
                return (
                  <option key={session.id} value={session.id}>
                    📱 {session.session_name} ({session.phone_number}) - {sessionGroups.length} مجموعة
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 pointer-events-none" />
          </div>
          <div className="mt-3 text-sm text-blue-600 font-medium">
            💡 اختر الجلسة لعرض المجموعات الخاصة بها فقط
          </div>
        </div>
      )}
      
      {/* Session Alert - إذا لم توجد جلسات */}
      {sessions.length === 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="text-lg font-bold text-orange-800">لا توجد جلسات تيليجرام</h3>
              <p className="text-orange-700">يجب إضافة جلسة تيليجرام أولاً من صفحة "إدارة الجلسات"</p>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center">
          <Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">
            {groups.length === 0 ? 'لا توجد مجموعات' : 'لا توجد نتائج'}
          </h3>
          <p className="text-neutral-600 mb-6">
            {groups.length === 0 
              ? 'ابدأ باستيراد مجموعاتك من حساباتك على تيليجرام'
              : 'جرب تعديل الفلاتر أو البحث'
            }
          </p>
          {groups.length === 0 && (
            <button
              onClick={() => setShowImportModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              استيراد المجموعات
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`bg-white p-6 rounded-2xl border-2 transition-all card-hover ${
                selectedGroups.includes(group.id) 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-neutral-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => toggleGroupSelection(group.id)}
                  className="w-5 h-5 text-primary-600 rounded mt-1"
                />
                <div className="flex gap-2 flex-wrap justify-end">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    group.type === 'channel' 
                      ? 'bg-purple-100 text-purple-700'
                      : group.type === 'supergroup'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {group.type === 'channel' ? '📢 قناة' : group.type === 'supergroup' ? '👥 مجموعة كبيرة' : '💬 مجموعة'}
                  </span>
                  {group.has_visible_participants && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      أعضاء ظاهرين
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-neutral-900 mb-2 line-clamp-2">
                {group.title}
              </h3>

              {group.username && (
                <p className="text-sm text-primary-600 mb-3">
                  @{group.username}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{group.members_count?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(group.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900">استيراد المجموعات</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  اختر الجلسة
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={importing}
                >
                  <option value="">-- اختر جلسة --</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.session_name} ({session.phone_number})
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">ستتم عملية الاستيراد:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>استيراد جميع المجموعات والقنوات المشترك فيها</li>
                      <li>حفظ المعلومات في قاعدة البيانات</li>
                      <li>يمكنك استخدامها في الحملات لاحقاً</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
                  disabled={importing}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleImportGroups}
                  disabled={importing || !selectedSessionId}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الاستيراد...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      استيراد الآن
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal - تصميم محسّن وصغير */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full max-h-[85vh] shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header - مضغوط وأنيق */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">بحث متقدم</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">ابحث عن مجموعات جديدة</p>
                </div>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* المحتوى القابل للسكرول */}
            <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="p-4 space-y-4">
                {/* Custom Keyword - مضغوط */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <label className="text-sm font-bold text-gray-900 dark:text-white">
                      كلمة مفتاحية مخصصة
                    </label>
                  </div>
                  <input
                    type="text"
                    value={customKeyword}
                    onChange={(e) => {
                      setCustomKeyword(e.target.value);
                      if (e.target.value) setSelectedCategory('');
                    }}
                    placeholder="مثال: برمجة، تسويق، أعمال..."
                    className="w-full px-3 py-2.5 text-sm border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                  />
                </div>

                {/* Session Selection - مضغوط */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      اختر الجلسة للبحث
                    </div>
                  </label>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                    disabled={searching}
                  >
                    <option value="">-- اختر جلسة --</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.session_name} ({session.phone_number})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Divider */}
                <div className="relative my-3">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <div className="h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600 w-12"></div>
                      <span>أو اختر من التصنيفات</span>
                      <div className="h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600 w-12"></div>
                    </div>
                  </div>
                </div>

                {/* Categories - سكرول منفصل */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <label className="text-sm font-bold text-gray-900 dark:text-white">
                      اختر تصنيف للبحث
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {SEARCH_CATEGORIES.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setCustomKeyword('');
                        }}
                        className={`p-3 rounded-lg border transition-all text-right hover:shadow-sm ${
                          selectedCategory === category.name
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 shadow-sm'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{category.icon}</div>
                          <div className="flex-1 text-right">
                            <div className="font-bold text-gray-900 dark:text-white mb-1 text-sm">{category.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {category.keywords.length} كلمة مفتاحية
                            </div>
                          </div>
                        </div>
                        
                        {/* عرض الكلمات في سطور منظمة - مضغوط */}
                        <div className="grid grid-cols-1 gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          {category.keywords.slice(0, 3).map((keyword) => (
                            <span 
                              key={keyword} 
                              className={`px-2 py-1 rounded text-xs font-medium text-center transition-colors ${
                                selectedCategory === category.name
                                  ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {keyword}
                            </span>
                          ))}
                          {category.keywords.length > 3 && (
                            <span className="px-2 py-1 rounded text-xs font-medium text-center bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400">
                              +{category.keywords.length - 3} أخرى
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* ملاحظة أسفل التصنيفات - مضغوطة */}
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Info className="w-4 h-4" />
                      <span className="text-xs font-medium">اضغط على تصنيف لرؤية الكلمات المفتاحية</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* ملاحظات تحضيرية - مضغوطة */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-purple-900 dark:text-purple-200 mb-2 text-sm">ملاحظات مهمة:</p>
                      <ul className="space-y-1 text-purple-800 dark:text-purple-300 text-xs">
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                          <span>سيتم البحث في المجموعات العامة</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                          <span>يمكنك الانضمام للمجموعات</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                          <span>النتائج تظهر حتى لو لم تكن مشتركاً</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* الأزرار - مضغوطة */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm"
                  disabled={searching}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSearchGroups}
                  disabled={searching || (!selectedCategory && !customKeyword) || !selectedSessionId}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm shadow-sm hover:shadow-md"
                >
                  {searching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري البحث...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      ابدأ البحث
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {showSearchResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">نتائج البحث</h3>
                  <p className="text-sm text-neutral-600">
                    {filteredSearchResults.length} من {searchResults.length} مجموعة
                    {filteredSearchResults.length !== searchResults.length && ' (بعد الفلترة)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchResults([]);
                  setSelectedSearchResults([]);
                }}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters for Search Results */}
            <div className="bg-neutral-50 rounded-xl p-4 mb-6 border border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-neutral-600" />
                  <h4 className="font-bold text-neutral-900">فلترة النتائج</h4>
                </div>
                <button
                  onClick={() => setShowSearchFilters(!showSearchFilters)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSearchFilters ? 'rotate-180' : ''}`} />
                  {showSearchFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                </button>
              </div>

              {showSearchFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Visible Members Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">ظهور الأعضاء</label>
                    <select
                      value={searchFilterVisibleMembers}
                      onChange={(e) => setSearchFilterVisibleMembers(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">الكل</option>
                      <option value="visible">أعضاء ظاهرين</option>
                      <option value="hidden">أعضاء مخفيين</option>
                    </select>
                  </div>

                  {/* Privacy Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">خاصة/عامة</label>
                    <select
                      value={searchFilterPrivacy}
                      onChange={(e) => setSearchFilterPrivacy(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">الكل</option>
                      <option value="public">عامة</option>
                      <option value="private">خاصة</option>
                    </select>
                  </div>

                  {/* Can Send Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">يمكن الإرسال</label>
                    <select
                      value={searchFilterCanSend}
                      onChange={(e) => setSearchFilterCanSend(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">الكل</option>
                      <option value="yes">يمكن الإرسال</option>
                      <option value="no">مغلقة</option>
                    </select>
                  </div>

                  {/* Restricted Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">مقيدة</label>
                    <select
                      value={searchFilterRestricted}
                      onChange={(e) => setSearchFilterRestricted(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">الكل</option>
                      <option value="no">غير مقيدة</option>
                      <option value="yes">مقيدة</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Select All */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
              <button
                onClick={() => {
                  if (selectedSearchResults.length === filteredSearchResults.length) {
                    setSelectedSearchResults([]);
                  } else {
                    setSelectedSearchResults(filteredSearchResults.map(r => r.id));
                  }
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {selectedSearchResults.length === filteredSearchResults.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              </button>
              
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <span className="font-medium">
                  {filteredSearchResults.length} من {searchResults.length} نتيجة
                </span>
                {selectedSearchResults.length > 0 && (
                  <span className="text-primary-600 font-medium">
                    {selectedSearchResults.length} محدد
                  </span>
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {filteredSearchResults.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  لا توجد نتائج تطابق الفلاتر المحددة
                </div>
              ) : (
                filteredSearchResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedSearchResults.includes(result.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                  onClick={() => toggleSearchResultSelection(result.id)}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedSearchResults.includes(result.id)}
                      onChange={() => toggleSearchResultSelection(result.id)}
                      className="w-5 h-5 text-primary-600 rounded mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-bold text-neutral-900 flex-1">
                          {result.title}
                        </h4>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                          result.type === 'channel' 
                            ? 'bg-purple-100 text-purple-700'
                            : result.type === 'supergroup'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {result.type === 'channel' ? '📢 قناة' : result.type === 'supergroup' ? '👥 مجموعة كبيرة' : '💬 مجموعة'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-neutral-600 flex-wrap">
                        {result.username && (
                          <span className="text-primary-600">@{result.username}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{result.members_count.toLocaleString()} عضو</span>
                        </div>
                        {result.members_visible !== undefined && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.members_visible 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {result.members_visible ? 'أعضاء ظاهرين' : 'أعضاء مخفيين'}
                          </span>
                        )}
                        {result.is_private !== undefined && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.is_private 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {result.is_private ? 'خاصة' : 'عامة'}
                          </span>
                        )}
                        {result.can_send !== undefined && !result.can_send && (
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                            مغلقة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <button
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchResults([]);
                  setSelectedSearchResults([]);
                }}
                className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
                disabled={importing}
              >
                إلغاء
              </button>
              <button
                onClick={handleImportSelectedResults}
                disabled={importing || selectedSearchResults.length === 0}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    استيراد المحدد ({selectedSearchResults.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
