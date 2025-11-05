/**
 * Telegram Campaign Create Edge Function
 * إنشاء حملة Telegram جديدة مع جميع الإعدادات المتقدمة
 * 
 * This function creates a new Telegram campaign with advanced settings including:
 * - Smart distribution across multiple sessions
 * - Delay configuration
 * - Member filtering options
 * - Message personalization settings
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const TELEGRAM_BACKEND_URL = Deno.env.get('TELEGRAM_BACKEND_URL') || 'http://localhost:8000';

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { 
            status: 200, 
            headers: corsHeaders 
        });
    }

    try {
        // Extract parameters from request body
        const requestData = await req.json();
        const {
            user_id,
            name,
            campaign_type,
            message_text,
            target_type,
            selected_groups = [],
            selected_members = [],
            session_ids = [],
            distribution_strategy = 'equal',
            max_messages_per_session = 100,
            max_messages_per_day = 200,
            delay_between_messages_min = 30,
            delay_between_messages_max = 90,
            delay_variation = true,
            exclude_sent_members = true,
            exclude_bots = true,
            exclude_premium = false,
            exclude_verified = false,
            exclude_scam = true,
            exclude_fake = true,
            personalize_messages = false,
            vary_emojis = false,
            message_templates = [],
            schedule_at = null
        } = requestData;

        // Validation
        if (!user_id || !name || !message_text || !campaign_type || !target_type) {
            throw new Error('المعاملات المطلوبة مفقودة: user_id, name, message_text, campaign_type, target_type');
        }

        if (!Array.isArray(session_ids) || session_ids.length === 0) {
            throw new Error('يجب تحديد جلسة واحدة على الأقل');
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('إعدادات Supabase مفقودة');
        }

        // Validate campaign_type
        if (!['groups', 'members', 'mixed'].includes(campaign_type)) {
            throw new Error('campaign_type يجب أن يكون: groups, members, أو mixed');
        }

        // Validate target_type
        if (!['groups', 'members', 'both'].includes(target_type)) {
            throw new Error('target_type يجب أن يكون: groups, members, أو both');
        }

        // Validate distribution_strategy
        if (!['equal', 'round_robin', 'random', 'weighted'].includes(distribution_strategy)) {
            throw new Error('distribution_strategy يجب أن يكون: equal, round_robin, random, أو weighted');
        }

        // Validate delay range
        if (delay_between_messages_min > delay_between_messages_max) {
            throw new Error('delay_between_messages_min يجب أن يكون أقل من أو يساوي delay_between_messages_max');
        }

        // Validate targets based on target_type
        if ((target_type === 'groups' || target_type === 'both') && (!Array.isArray(selected_groups) || selected_groups.length === 0)) {
            throw new Error('يجب تحديد مجموعة واحدة على الأقل عندما يكون target_type هو groups أو both');
        }

        if ((target_type === 'members' || target_type === 'both') && (!Array.isArray(selected_members) || selected_members.length === 0)) {
            throw new Error('يجب تحديد عضو واحد على الأقل عندما يكون target_type هو members أو both');
        }

        // Verify sessions exist and are active
        const sessionsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_sessions?id=in.(${session_ids.join(',')})&user_id=eq.${user_id}&status=eq.active`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!sessionsResponse.ok) {
            throw new Error('فشل في جلب بيانات الجلسات');
        }

        const sessions = await sessionsResponse.json();
        
        if (sessions.length !== session_ids.length) {
            throw new Error('بعض الجلسات المحددة غير موجودة أو غير نشطة');
        }

        // Verify groups exist (if selected)
        if (selected_groups.length > 0) {
            const groupsResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/telegram_groups?telegram_group_id=in.(${selected_groups.join(',')})&user_id=eq.${user_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!groupsResponse.ok) {
                throw new Error('فشل في جلب بيانات المجموعات');
            }

            const groups = await groupsResponse.json();
            
            if (groups.length !== selected_groups.length) {
                throw new Error('بعض المجموعات المحددة غير موجودة');
            }
        }

        // Verify members exist (if selected)
        if (selected_members.length > 0) {
            const membersResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/telegram_members?telegram_user_id=in.(${selected_members.join(',')})&user_id=eq.${user_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!membersResponse.ok) {
                throw new Error('فشل في جلب بيانات الأعضاء');
            }

            const members = await membersResponse.json();
            
            if (members.length !== selected_members.length) {
                throw new Error('بعض الأعضاء المحددين غير موجودين');
            }
        }

        // Validate with Backend API
        try {
            const backendValidation = await fetch(`${TELEGRAM_BACKEND_URL}/campaigns/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    campaign_type,
                    message_text,
                    target_type,
                    selected_groups,
                    selected_members,
                    session_ids,
                    distribution_strategy,
                    max_messages_per_session,
                    max_messages_per_day,
                    delay_between_messages_min,
                    delay_between_messages_max,
                    delay_variation,
                    exclude_sent_members,
                    exclude_bots,
                    exclude_premium,
                    exclude_verified,
                    exclude_scam,
                    exclude_fake,
                    personalize_messages,
                    vary_emojis,
                    message_templates,
                    schedule_at
                })
            });

            if (!backendValidation.ok) {
                const errorData = await backendValidation.json();
                throw new Error(errorData.detail || 'فشل في التحقق من صحة بيانات الحملة');
            }
        } catch (backendError) {
            console.error('خطأ في التحقق من Backend:', backendError);
            throw new Error(`فشل في التحقق من صحة البيانات: ${backendError.message}`);
        }

        // Calculate total targets
        let total_targets = 0;
        if (target_type === 'groups' || target_type === 'both') {
            total_targets += selected_groups.length;
        }
        if (target_type === 'members' || target_type === 'both') {
            total_targets += selected_members.length;
        }

        // Determine status
        let status = 'draft';
        if (schedule_at) {
            const scheduleDate = new Date(schedule_at);
            const now = new Date();
            if (scheduleDate > now) {
                status = 'scheduled';
            } else {
                status = 'draft'; // If schedule is in the past, save as draft
            }
        }

        // Create campaign record
        const campaignRecord = {
            user_id,
            name,
            campaign_type,
            message_text,
            status,
            target_type,
            selected_groups: selected_groups.length > 0 ? selected_groups : null,
            selected_members: selected_members.length > 0 ? selected_members : null,
            session_ids,
            distribution_strategy,
            max_messages_per_session,
            max_messages_per_day,
            delay_between_messages_min,
            delay_between_messages_max,
            delay_variation,
            exclude_sent_members,
            exclude_bots,
            exclude_premium,
            exclude_verified,
            exclude_scam,
            exclude_fake,
            personalize_messages,
            vary_emojis,
            message_templates: message_templates.length > 0 ? message_templates : null,
            schedule_at: schedule_at || null,
            total_targets,
            sent_count: 0,
            failed_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Insert campaign into database
        const insertResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_campaigns`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(campaignRecord)
            }
        );

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('فشل في حفظ الحملة:', errorText);
            throw new Error(`فشل في حفظ الحملة في قاعدة البيانات: ${errorText}`);
        }

        const createdCampaign = await insertResponse.json();
        const campaign = Array.isArray(createdCampaign) ? createdCampaign[0] : createdCampaign;

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                message: 'تم إنشاء الحملة بنجاح',
                data: {
                    campaign_id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    campaign_type: campaign.campaign_type,
                    target_type: campaign.target_type,
                    total_targets: campaign.total_targets,
                    total_sessions: session_ids.length,
                    schedule_at: campaign.schedule_at,
                    created_at: campaign.created_at
                }
            }),
            {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('خطأ في إنشاء الحملة:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'CAMPAIGN_CREATE_FAILED',
                    message: error.message || 'خطأ في إنشاء الحملة',
                    timestamp: new Date().toISOString()
                }
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});

