/**
 * Telegram Campaign Start Edge Function
 * بدء تنفيذ حملة Telegram
 * 
 * This function starts a campaign execution by:
 * 1. Loading campaign data from database
 * 2. Updating campaign status to 'active'
 * 3. Distributing tasks across sessions
 * 4. Initiating the sending process
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
        requestData = await req.json();
        const { campaign_id, user_id } = requestData;
        
        console.log('========== بدء حملة ==========');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Request received:', {
            campaign_id: campaign_id || null,
            user_id: user_id || null
        });
        console.log('Environment check:', {
            supabase_url: SUPABASE_URL ? 'Set' : 'Missing',
            service_role_key: SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
            telegram_backend_url: TELEGRAM_BACKEND_URL
        });

        if (!campaign_id || !user_id) {
            throw new Error('المعاملات المطلوبة مفقودة: campaign_id, user_id');
        }

        // التحقق من Environment Variables (مثل الوظائف الناجحة)
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            const errorMsg = 'إعدادات Supabase مفقودة - Supabase configuration missing';
            console.error('⚠️', errorMsg);
            throw new Error(errorMsg);
        }

        // Load campaign from database
        const campaignResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_campaigns?id=eq.${campaign_id}&user_id=eq.${user_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!campaignResponse.ok) {
            const errorText = await campaignResponse.text();
            console.error(`فشل في جلب بيانات الحملة: ${campaignResponse.status} - ${errorText}`);
            throw new Error(`فشل في جلب بيانات الحملة: ${errorText.substring(0, 200)}`);
        }

        const campaigns = await campaignResponse.json();
        if (!campaigns || campaigns.length === 0) {
            console.error(`الحملة غير موجودة: campaign_id=${campaign_id}, user_id=${user_id}`);
            throw new Error('الحملة غير موجودة أو غير مصرح بها');
        }

        const campaign = campaigns[0];
        console.log(`✓ تم العثور على الحملة: ${campaign.id} - ${campaign.name} (status: ${campaign.status})`);

        // Validate campaign status
        if (campaign.status === 'active') {
            throw new Error('الحملة قيد التنفيذ بالفعل');
        }

        if (campaign.status === 'completed') {
            throw new Error('الحملة مكتملة بالفعل');
        }

        if (campaign.status === 'failed') {
            throw new Error('الحملة فشلت. يجب إنشاء حملة جديدة');
        }

        // Check if scheduled campaign should start
        if (campaign.status === 'scheduled') {
            const scheduleDate = new Date(campaign.schedule_at);
            const now = new Date();
            if (scheduleDate > now) {
                throw new Error(`الحملة مجدولة للبدء في ${scheduleDate.toISOString()}`);
            }
        }

        // Verify sessions are active
        const sessionIds = Array.isArray(campaign.session_ids) ? campaign.session_ids : [];
        if (sessionIds.length === 0) {
            throw new Error('لا توجد جلسات محددة للحملة');
        }

        const sessionsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_sessions?id=in.(${sessionIds.join(',')})&user_id=eq.${user_id}&status=eq.active`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!sessionsResponse.ok) {
            const errorText = await sessionsResponse.text();
            console.error(`فشل في جلب بيانات الجلسات: ${sessionsResponse.status} - ${errorText}`);
            throw new Error(`فشل في جلب بيانات الجلسات: ${errorText.substring(0, 200)}`);
        }

        const sessions = await sessionsResponse.json();
        console.log(`تم العثور على ${sessions.length} جلسة نشطة من ${sessionIds.length} مطلوبة`);
        
        if (sessions.length === 0) {
            throw new Error('لا توجد جلسات نشطة');
        }

        if (sessions.length !== sessionIds.length) {
            const missingSessions = sessionIds.filter(id => !sessions.find((s: any) => s.id === id));
            console.error(`جلسات مفقودة أو غير نشطة:`, missingSessions);
            throw new Error(`بعض الجلسات المحددة غير نشطة. الجلسات المفقودة: ${missingSessions.join(', ')}`);
        }

        // Update campaign status to 'active'
        const patchCampaign = async (payload: Record<string, any>, throwOnError: boolean = true) => {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/telegram_campaigns?id=eq.${campaign_id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`✗ فشل في تحديث حالة الحملة:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText.substring(0, 500)
                });

                if (throwOnError) {
                    throw new Error(`فشل في تحديث حالة الحملة: ${errorText.substring(0, 200)}`);
                }
            }

            return response;
        };

        const nowIso = new Date().toISOString();
        await patchCampaign({
            status: 'active',
            started_at: nowIso,
            updated_at: nowIso
        });

        if (!TELEGRAM_BACKEND_URL || TELEGRAM_BACKEND_URL === 'http://localhost:8000') {
            console.warn('⚠️ TELEGRAM_BACKEND_URL غير مضبوط. سيتم تحديث قاعدة البيانات فقط بدون إبلاغ Backend.');
        } else {
            try {
                const selectedGroups = Array.isArray(campaign.selected_groups) ? campaign.selected_groups : [];
                const selectedMembers = Array.isArray(campaign.selected_members) ? campaign.selected_members : [];

                const backendPayload = {
                    campaign_id: campaign.id,
                    user_id,
                    name: campaign.name,
                    session_ids: sessionIds,
                    total_targets: campaign.total_targets || selectedGroups.length + selectedMembers.length,
                    distribution_strategy: campaign.distribution_strategy || 'equal',
                    settings: {
                        delay_between_messages_min: campaign.delay_between_messages_min,
                        delay_between_messages_max: campaign.delay_between_messages_max,
                        delay_variation: campaign.delay_variation,
                        max_messages_per_session: campaign.max_messages_per_session,
                        max_messages_per_day: campaign.max_messages_per_day,
                        exclude_sent_members: campaign.exclude_sent_members,
                        exclude_bots: campaign.exclude_bots,
                        exclude_premium: campaign.exclude_premium,
                        exclude_verified: campaign.exclude_verified,
                        exclude_scam: campaign.exclude_scam,
                        exclude_fake: campaign.exclude_fake,
                        personalize_messages: campaign.personalize_messages,
                        vary_emojis: campaign.vary_emojis
                    },
                    metadata: {
                        campaign_type: campaign.campaign_type,
                        target_type: campaign.target_type,
                        schedule_at: campaign.schedule_at,
                        selected_groups_count: selectedGroups.length,
                        selected_members_count: selectedMembers.length
                    }
                };

                console.log(`📡 إبلاغ Telegram Backend ببدء الحملة: ${TELEGRAM_BACKEND_URL}/campaigns/start/${campaign.id}`);
                const backendResponse = await fetch(`${TELEGRAM_BACKEND_URL}/campaigns/start/${campaign.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(backendPayload)
                });

                if (!backendResponse.ok) {
                    const backendErrorText = await backendResponse.text();
                    console.error('✗ فشل في استدعاء Telegram Backend لبدء الحملة:', backendErrorText);
                    await patchCampaign({
                        status: 'failed',
                        updated_at: new Date().toISOString()
                    }, false);
                    throw new Error(`فشل في إعلام Telegram Backend: ${backendErrorText.substring(0, 200)}`);
                }

                const backendResult = await backendResponse.json().catch(() => ({}));
                console.log('✓ تم تسجيل الحملة في Telegram Backend:', backendResult);
            } catch (backendError) {
                console.error('✗ حدث خطأ أثناء إبلاغ Telegram Backend:', backendError);
                throw backendError instanceof Error ? backendError : new Error(String(backendError));
            }
        }

        console.log(`✓ تم بدء الحملة بنجاح: ${campaign.id}`);
        console.log('========================================');

        // Return success response (مثل telegram-import-groups)
        return new Response(
            JSON.stringify({
                success: true,
                message: 'تم بدء الحملة بنجاح',
                data: {
                    campaign_id: campaign.id,
                    status: 'active',
                    started_at: new Date().toISOString(),
                    total_sessions: sessions.length,
                    total_targets: campaign.total_targets,
                    timestamp: new Date().toISOString()
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        // معالجة الأخطاء مثل telegram-import-groups
        console.error('========== خطأ في بدء الحملة ==========');
        console.error('Timestamp:', new Date().toISOString());
        
        // Extract error message safely (مثل telegram-import-groups)
        let errorMessage = 'حدث خطأ غير معروف';
        let errorDetails: any = null;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
                name: error.name,
                stack: error.stack,
                cause: error.cause
            };
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            errorMessage = (error as any).message || JSON.stringify(error);
            errorDetails = error;
        }
        
        console.error('Error message:', errorMessage);
        console.error('Error details:', {
            message: errorMessage,
            details: errorDetails,
            request_data: requestData ? {
                campaign_id: requestData.campaign_id || null,
                user_id: requestData.user_id || null
            } : null,
            environment: {
                supabase_url: SUPABASE_URL ? 'Set' : 'Missing',
                telegram_backend_url: TELEGRAM_BACKEND_URL || 'Not set'
            }
        });
        console.error('========================================');

        // Return error response (مثل telegram-import-groups و telegram-search-groups)
        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'CAMPAIGN_START_FAILED',
                    message: `خطأ في بدء الحملة: ${errorMessage}`,
                    details: errorDetails,
                    timestamp: new Date().toISOString()
                }
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});

