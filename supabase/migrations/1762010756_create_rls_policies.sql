-- Migration: create_rls_policies
-- Created at: 1762010756

-- ==========================================
-- RLS Policies لجدول profiles
-- ==========================================

-- المستخدمون يمكنهم قراءة ملفاتهم الشخصية فقط
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- المستخدمون يمكنهم تحديث ملفاتهم الشخصية فقط
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- المستخدمون يمكنهم إدراج ملفاتهم الشخصية
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- RLS Policies لجدول subscription_plans
-- ==========================================

-- الجميع يمكنهم قراءة الخطط النشطة
CREATE POLICY "Anyone can view active plans" ON subscription_plans
FOR SELECT USING (is_active = true);

-- ==========================================
-- RLS Policies لجدول subscriptions
-- ==========================================

-- المستخدمون يمكنهم قراءة اشتراكاتهم فقط
CREATE POLICY "Users can view own subscriptions" ON subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إنشاء اشتراكاتهم
CREATE POLICY "Users can insert own subscriptions" ON subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث اشتراكاتهم
CREATE POLICY "Users can update own subscriptions" ON subscriptions
FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- RLS Policies لجدول platforms
-- ==========================================

-- الجميع يمكنهم قراءة المنصات النشطة
CREATE POLICY "Anyone can view active platforms" ON platforms
FOR SELECT USING (is_active = true);

-- ==========================================
-- RLS Policies لجدول user_platforms
-- ==========================================

-- المستخدمون يمكنهم قراءة منصاتهم المربوطة
CREATE POLICY "Users can view own platforms" ON user_platforms
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة منصات
CREATE POLICY "Users can insert own platforms" ON user_platforms
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث منصاتهم
CREATE POLICY "Users can update own platforms" ON user_platforms
FOR UPDATE USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف منصاتهم
CREATE POLICY "Users can delete own platforms" ON user_platforms
FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- RLS Policies لجدول points_transactions
-- ==========================================

-- المستخدمون يمكنهم قراءة معاملات النقاط الخاصة بهم
CREATE POLICY "Users can view own points transactions" ON points_transactions
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة معاملات نقاط
CREATE POLICY "Users can insert own points transactions" ON points_transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- RLS Policies لجدول invoices
-- ==========================================

-- المستخدمون يمكنهم قراءة فواتيرهم
CREATE POLICY "Users can view own invoices" ON invoices
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة فواتير
CREATE POLICY "Users can insert own invoices" ON invoices
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- RLS Policies لجدول notifications
-- ==========================================

-- المستخدمون يمكنهم قراءة إشعاراتهم
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث إشعاراتهم (تعليم كمقروء)
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- RLS Policies لجدول activities
-- ==========================================

-- المستخدمون يمكنهم قراءة أنشطتهم
CREATE POLICY "Users can view own activities" ON activities
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة أنشطة
CREATE POLICY "Users can insert own activities" ON activities
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- RLS Policies لجدول features
-- ==========================================

-- الجميع يمكنهم قراءة الميزات النشطة
CREATE POLICY "Anyone can view active features" ON features
FOR SELECT USING (is_active = true);

-- ==========================================
-- RLS Policies لجدول plan_features
-- ==========================================

-- الجميع يمكنهم قراءة ميزات الخطط
CREATE POLICY "Anyone can view plan features" ON plan_features
FOR SELECT USING (true);

-- ==========================================
-- RLS Policies لجدول api_keys
-- ==========================================

-- المستخدمون يمكنهم قراءة مفاتيح API الخاصة بهم
CREATE POLICY "Users can view own api keys" ON api_keys
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة مفاتيح API
CREATE POLICY "Users can insert own api keys" ON api_keys
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث مفاتيح API الخاصة بهم
CREATE POLICY "Users can update own api keys" ON api_keys
FOR UPDATE USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف مفاتيح API الخاصة بهم
CREATE POLICY "Users can delete own api keys" ON api_keys
FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- RLS Policies لجدول campaigns
-- ==========================================

-- المستخدمون يمكنهم قراءة حملاتهم
CREATE POLICY "Users can view own campaigns" ON campaigns
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة حملات
CREATE POLICY "Users can insert own campaigns" ON campaigns
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث حملاتهم
CREATE POLICY "Users can update own campaigns" ON campaigns
FOR UPDATE USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف حملاتهم
CREATE POLICY "Users can delete own campaigns" ON campaigns
FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- RLS Policies لجدول reports
-- ==========================================

-- المستخدمون يمكنهم قراءة تقاريرهم
CREATE POLICY "Users can view own reports" ON reports
FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة تقارير
CREATE POLICY "Users can insert own reports" ON reports
FOR INSERT WITH CHECK (auth.uid() = user_id);;