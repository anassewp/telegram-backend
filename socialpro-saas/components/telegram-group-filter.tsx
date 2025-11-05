'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export interface GroupFilterOptions {
  // نوع المجموعة
  type: 'all' | 'groups_only' | 'group' | 'supergroup' | 'channel';
  
  // ظهور الأعضاء
  membersVisibility: 'all' | 'fully_visible' | 'admin_only' | 'hidden';
  
  // الخصوصية
  privacy: 'all' | 'public' | 'private';
  
  // إمكانية الإرسال
  canSend: 'all' | 'yes' | 'no';
  
  // مقيدة
  restricted: 'all' | 'yes' | 'no';
  
  // عدد الأعضاء (نطاق)
  membersCountMin?: number;
  membersCountMax?: number;
  
  // جلسة محددة
  sessionId?: string;
  
  // حالة النشاط
  isActive?: 'all' | 'yes' | 'no';
  
  // البحث النصي
  searchText?: string;
}

interface TelegramGroupFilterProps {
  filters: GroupFilterOptions;
  onFiltersChange: (filters: GroupFilterOptions) => void;
  onReset?: () => void;
  showAdvanced?: boolean;
  sessions?: Array<{ id: string; session_name: string }>;
}

export default function TelegramGroupFilter({
  filters,
  onFiltersChange,
  onReset,
  showAdvanced = true,
  sessions = []
}: TelegramGroupFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);

  const updateFilter = <K extends keyof GroupFilterOptions>(
    key: K,
    value: GroupFilterOptions[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleReset = () => {
    const defaultFilters: GroupFilterOptions = {
      type: 'all',
      membersVisibility: 'all',
      privacy: 'all',
      canSend: 'all',
      restricted: 'all',
      membersCountMin: undefined,
      membersCountMax: undefined,
      sessionId: 'all',
      isActive: 'all',
      searchText: undefined
    };
    onFiltersChange(defaultFilters);
    if (onReset) {
      onReset();
    }
  };

  const hasActiveFilters = 
    filters.type !== 'all' ||
    filters.membersVisibility !== 'all' ||
    filters.privacy !== 'all' ||
    filters.canSend !== 'all' ||
    filters.restricted !== 'all' ||
    filters.membersCountMin !== undefined ||
    filters.membersCountMax !== undefined ||
    (filters.sessionId && filters.sessionId !== 'all') ||
    (filters.isActive && filters.isActive !== 'all') ||
    (filters.searchText && filters.searchText.trim() !== '');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            فلتر شامل للمجموعات
          </h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              فلاتر نشطة
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="إعادة تعيين الفلاتر"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Row 1: Type, Members Visibility, Privacy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter - تصنيف النوع (جروب/قناة) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تصنيف النوع (جروب/قناة)
              </label>
              <select
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value as GroupFilterOptions['type'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الأنواع</option>
                <option value="groups_only">مجموعات فقط (جروب + سوبر جروب)</option>
                <option value="group">جروب عادي</option>
                <option value="supergroup">سوبر جروب</option>
                <option value="channel">قناة</option>
              </select>
            </div>

            {/* Members Visibility Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ظهور الأعضاء
              </label>
              <select
                value={filters.membersVisibility}
                onChange={(e) => updateFilter('membersVisibility', e.target.value as GroupFilterOptions['membersVisibility'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="fully_visible">ظاهرين بالكامل</option>
                <option value="admin_only">للإدمن فقط</option>
                <option value="hidden">مخفيين</option>
              </select>
            </div>

            {/* Privacy Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الخصوصية
              </label>
              <select
                value={filters.privacy}
                onChange={(e) => updateFilter('privacy', e.target.value as GroupFilterOptions['privacy'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="public">عامة</option>
                <option value="private">خاصة</option>
              </select>
            </div>
          </div>

          {/* Row 2: Can Send, Restricted, Session */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Can Send Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                إمكانية الإرسال
              </label>
              <select
                value={filters.canSend}
                onChange={(e) => updateFilter('canSend', e.target.value as GroupFilterOptions['canSend'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="yes">يمكن الإرسال</option>
                <option value="no">لا يمكن الإرسال</option>
              </select>
            </div>

            {/* Restricted Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مقيدة
              </label>
              <select
                value={filters.restricted}
                onChange={(e) => updateFilter('restricted', e.target.value as GroupFilterOptions['restricted'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="yes">مقيدة</option>
                <option value="no">غير مقيدة</option>
              </select>
            </div>

            {/* Session Filter */}
            {sessions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الجلسة
                </label>
                <select
                  value={filters.sessionId || 'all'}
                  onChange={(e) => updateFilter('sessionId', e.target.value === 'all' ? undefined : e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">جميع الجلسات</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.session_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Row 3: Members Count Range */}
          {showAdvancedOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عدد الأعضاء (الحد الأدنى)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.membersCountMin || ''}
                  onChange={(e) => updateFilter('membersCountMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="الحد الأدنى"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عدد الأعضاء (الحد الأقصى)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.membersCountMax || ''}
                  onChange={(e) => updateFilter('membersCountMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="الحد الأقصى"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Row 4: Search Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              البحث النصي (اسم المجموعة)
            </label>
            <input
              type="text"
              value={filters.searchText || ''}
              onChange={(e) => updateFilter('searchText', e.target.value || undefined)}
              placeholder="ابحث عن اسم المجموعة..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة تعيين جميع الفلاتر
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

