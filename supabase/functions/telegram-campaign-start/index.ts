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

    try {
        const requestData = await req.json();
        const { campaign_id, user_id } = requestData;

        if (!campaign_id || !user_id) {
            throw new Error('المعاملات المطلوبة مفقودة: campaign_id, user_id');
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('إعدادات Supabase مفقودة');
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
            throw new Error('فشل في جلب بيانات الحملة');
        }

        const campaigns = await campaignResponse.json();
        if (!campaigns || campaigns.length === 0) {
            throw new Error('الحملة غير موجودة أو غير مصرح بها');
        }

        const campaign = campaigns[0];

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
            throw new Error('فشل في جلب بيانات الجلسات');
        }

        const sessions = await sessionsResponse.json();
        if (sessions.length === 0) {
            throw new Error('لا توجد جلسات نشطة');
        }

        if (sessions.length !== sessionIds.length) {
            throw new Error('بعض الجلسات المحددة غير نشطة');
        }

        // Update campaign status to 'active'
        const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_campaigns?id=eq.${campaign_id}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    status: 'active',
                    started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`فشل في تحديث حالة الحملة: ${errorText}`);
        }

        // Return success response
        // Note: Actual message sending will be handled by telegram-campaign-send-batch
        return new Response(
            JSON.stringify({
                success: true,
                message: 'تم بدء الحملة بنجاح',
                data: {
                    campaign_id: campaign.id,
                    status: 'active',
                    started_at: new Date().toISOString(),
                    total_sessions: sessions.length,
                    total_targets: campaign.total_targets
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('خطأ في بدء الحملة:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'CAMPAIGN_START_FAILED',
                    message: error.message || 'خطأ في بدء الحملة',
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

