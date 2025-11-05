-- Migration: create_comprehensive_indexes
-- Created at: 1762102498

-- إنشاء فهارس للجداول الأساسية
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- فهارس حسابات وسائل التواصل الاجتماعي
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform_id ON social_accounts(platform_id);
CREATE INDEX idx_social_accounts_account_handle ON social_accounts(account_handle);
CREATE INDEX idx_social_accounts_is_active ON social_accounts(is_active);
CREATE INDEX idx_account_credentials_account_id ON account_credentials(account_id);
CREATE INDEX idx_account_credentials_is_valid ON account_credentials(is_valid);
CREATE INDEX idx_account_settings_account_id ON account_settings(account_id);

-- فهارس المنشورات
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_account_id ON posts(account_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_media_files_post_id ON media_files(post_id);
CREATE INDEX idx_post_categories_user_id ON post_categories(user_id);
CREATE INDEX idx_post_schedules_post_id ON post_schedules(post_id);

-- فهارس الحملات والتحليلات
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX idx_campaign_metrics_metric_date ON campaign_metrics(metric_date);
CREATE INDEX idx_analytics_daily_user_id ON analytics_daily(user_id);
CREATE INDEX idx_analytics_daily_account_id ON analytics_daily(account_id);
CREATE INDEX idx_analytics_daily_metric_date ON analytics_daily(metric_date);
CREATE INDEX idx_performance_insights_user_id ON performance_insights(user_id);
CREATE INDEX idx_performance_insights_insight_type ON performance_insights(insight_type);
CREATE INDEX idx_performance_insights_is_read ON performance_insights(is_read);

-- فهارس التفاعل والمتابعة
CREATE INDEX idx_followers_user_id ON followers(user_id);
CREATE INDEX idx_followers_account_id ON followers(account_id);
CREATE INDEX idx_following_user_id ON following(user_id);
CREATE INDEX idx_following_account_id ON following(account_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_account_id ON interactions(account_id);
CREATE INDEX idx_interactions_interaction_type ON interactions(interaction_type);
CREATE INDEX idx_engagement_metrics_user_id ON engagement_metrics(user_id);
CREATE INDEX idx_engagement_metrics_account_id ON engagement_metrics(account_id);
CREATE INDEX idx_engagement_metrics_metric_date ON engagement_metrics(metric_date);

-- فهارس الإعدادات العامة
CREATE INDEX idx_system_settings_setting_key ON system_settings(setting_key);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_name ON api_keys(key_name);
CREATE INDEX idx_api_keys_platform ON api_keys(platform);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_action_type ON usage_logs(action_type);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- فهارس للجدول الموجود مسبقاً
CREATE INDEX idx_telegram_groups_user_id ON telegram_groups(imported_by);
CREATE INDEX idx_telegram_groups_type ON telegram_groups(type);
CREATE INDEX idx_telegram_groups_import_status ON telegram_groups(import_status);;