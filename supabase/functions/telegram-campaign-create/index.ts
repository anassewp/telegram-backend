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

    let requestData: any = null;
    
    try {
        // Extract parameters from request body
        requestData = await req.json();
        console.log('Received request data:', JSON.stringify({
            ...requestData,
            selected_groups: requestData.selected_groups,
            selected_members: requestData.selected_members,
            selected_group_usernames: requestData.selected_group_usernames,
            selected_member_usernames: requestData.selected_member_usernames
        }));
        
        const {
            user_id,
            name,
            campaign_type,
            message_text,
            target_type,
            selected_groups = [],
            selected_members = [],
            selected_group_usernames = [],
            selected_member_usernames = [],
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

        // Validate targets based on target_type (including usernames)
        const totalGroups = (Array.isArray(selected_groups) ? selected_groups.length : 0) + 
                           (Array.isArray(selected_group_usernames) ? selected_group_usernames.length : 0);
        const totalMembers = (Array.isArray(selected_members) ? selected_members.length : 0) + 
                            (Array.isArray(selected_member_usernames) ? selected_member_usernames.length : 0);

        if ((target_type === 'groups' || target_type === 'both') && totalGroups === 0) {
            throw new Error('يجب تحديد مجموعة واحدة على الأقل (ID أو username) عندما يكون target_type هو groups أو both');
        }

        if ((target_type === 'members' || target_type === 'both') && totalMembers === 0) {
            throw new Error('يجب تحديد عضو واحد على الأقل (ID أو username) عندما يكون target_type هو members أو both');
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

        // Verify groups exist (if selected) - only verify IDs that exist in database
        // Usernames will be resolved at send time
        if (Array.isArray(selected_groups) && selected_groups.length > 0) {
            // Try both group_id and telegram_group_id fields
            const groupsResponse1 = await fetch(
                `${SUPABASE_URL}/rest/v1/telegram_groups?group_id=in.(${selected_groups.join(',')})&user_id=eq.${user_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            let groups: any[] = [];
            if (groupsResponse1.ok) {
                groups = await groupsResponse1.json();
            }

            // If not found, try telegram_group_id
            if (groups.length < selected_groups.length) {
                const groupsResponse2 = await fetch(
                    `${SUPABASE_URL}/rest/v1/telegram_groups?telegram_group_id=in.(${selected_groups.join(',')})&user_id=eq.${user_id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (groupsResponse2.ok) {
                    const groups2: any[] = await groupsResponse2.json();
                    // Merge results, avoiding duplicates
                    const foundIds = new Set(groups.map((g: any) => g.group_id || g.telegram_group_id || g.id));
                    groups = [...groups, ...groups2.filter((g: any) => {
                        const gId = g.group_id || g.telegram_group_id || g.id;
                        return !foundIds.has(gId);
                    })];
                }
            }

            // Note: We allow IDs that don't exist in DB (manual entries)
            // They will be resolved at send time
            console.log(`Found ${groups.length} out of ${selected_groups.length} groups in database`);
        }

        // Verify members exist (if selected) - only verify IDs that exist in database
        // Usernames will be resolved at send time
        if (Array.isArray(selected_members) && selected_members.length > 0) {
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

            let members = [];
            if (membersResponse.ok) {
                members = await membersResponse.json();
            }

            // Note: We allow IDs that don't exist in DB (manual entries)
            // They will be resolved at send time
            console.log(`Found ${members.length} out of ${selected_members.length} members in database`);
        }

        // Validate with Backend API (optional - skip if endpoint doesn't exist)
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
                    selected_groups: Array.isArray(selected_groups) ? selected_groups : [],
                    selected_members: Array.isArray(selected_members) ? selected_members : [],
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
                // If endpoint returns error, log it but don't fail (backend might not have this endpoint yet)
                console.warn('Backend validation endpoint returned error, continuing anyway');
                try {
                    const errorData = await backendValidation.json();
                    console.warn('Backend error:', errorData);
                } catch (e) {
                    console.warn('Backend validation failed, but continuing');
                }
            }
        } catch (backendError) {
            // If backend endpoint doesn't exist or fails, continue anyway
            console.warn('Backend validation skipped:', backendError.message);
        }

        // Calculate total targets (including usernames)
        // حساب صحيح يتعامل مع JSONB arrays
        let total_targets = 0;
        
        if (target_type === 'groups' || target_type === 'both') {
            const groupsCount = Array.isArray(selected_groups) ? selected_groups.length : 0;
            const usernamesCount = Array.isArray(selected_group_usernames) ? selected_group_usernames.length : 0;
            total_targets += groupsCount + usernamesCount;
        }
        
        if (target_type === 'members' || target_type === 'both') {
            const membersCount = Array.isArray(selected_members) ? selected_members.length : 0;
            const usernamesCount = Array.isArray(selected_member_usernames) ? selected_member_usernames.length : 0;
            total_targets += membersCount + usernamesCount;
        }
        
        // التحقق من أن total_targets > 0
        if (total_targets === 0) {
            throw new Error('يجب تحديد هدف واحد على الأقل (مجموعة أو عضو)');
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
        // Combine IDs and usernames into JSONB arrays
        const allGroups = [
            ...(Array.isArray(selected_groups) ? selected_groups : []),
            ...(Array.isArray(selected_group_usernames) ? selected_group_usernames.map(u => ({ username: u })) : [])
        ];
        
        const allMembers = [
            ...(Array.isArray(selected_members) ? selected_members : []),
            ...(Array.isArray(selected_member_usernames) ? selected_member_usernames.map(u => ({ username: u })) : [])
        ];

        const campaignRecord = {
            user_id,
            name,
            campaign_type,
            message_text,
            status,
            target_type,
            selected_groups: allGroups.length > 0 ? allGroups : null,
            selected_members: allMembers.length > 0 ? allMembers : null,
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

    } catch (error: any) {
        // Logging شامل للأخطاء
        const errorDetails = {
            timestamp: new Date().toISOString(),
            error_name: error?.name || 'Unknown',
            error_message: error?.message || 'خطأ غير معروف',
            error_stack: error?.stack || 'No stack trace',
            error_cause: error?.cause || null,
            request_data: requestData ? {
                user_id: requestData.user_id || null,
                name: requestData.name || null,
                campaign_type: requestData.campaign_type || null,
                target_type: requestData.target_type || null,
                selected_groups_count: Array.isArray(requestData.selected_groups) ? requestData.selected_groups.length : 0,
                selected_members_count: Array.isArray(requestData.selected_members) ? requestData.selected_members.length : 0,
                session_ids_count: Array.isArray(requestData.session_ids) ? requestData.session_ids.length : 0
            } : null,
            environment: {
                supabase_url: SUPABASE_URL ? 'Set' : 'Missing',
                telegram_backend_url: TELEGRAM_BACKEND_URL || 'Not set'
            }
        };

        console.error('========== خطأ في إنشاء الحملة ==========');
        console.error('Timestamp:', errorDetails.timestamp);
        console.error('Error Name:', errorDetails.error_name);
        console.error('Error Message:', errorDetails.error_message);
        console.error('Error Stack:', errorDetails.error_stack);
        console.error('Request Data:', JSON.stringify(errorDetails.request_data, null, 2));
        console.error('Environment:', JSON.stringify(errorDetails.environment, null, 2));
        console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('=========================================');

        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'CAMPAIGN_CREATE_FAILED',
                    message: error.message || 'خطأ في إنشاء الحملة',
                    timestamp: new Date().toISOString(),
                    details: errorDetails
                }
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});

