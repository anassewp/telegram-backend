/**
 * Telegram Campaign Resume Edge Function
 * استئناف حملة Telegram الموقوفة
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

        // Load campaign
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
        if (campaign.status !== 'paused') {
            throw new Error(`لا يمكن استئناف الحملة. الحالة الحالية: ${campaign.status}`);
        }

        // Verify sessions are still active
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
                    paused_at: null,
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`فشل في تحديث حالة الحملة: ${errorText}`);
        }

        const updatedCampaign = await updateResponse.json();
        const campaignData = Array.isArray(updatedCampaign) ? updatedCampaign[0] : updatedCampaign;

        return new Response(
            JSON.stringify({
                success: true,
                message: 'تم استئناف الحملة بنجاح',
                data: {
                    campaign_id: campaignData.id,
                    status: campaignData.status,
                    sent_count: campaignData.sent_count,
                    failed_count: campaignData.failed_count,
                    total_targets: campaignData.total_targets
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('خطأ في استئناف الحملة:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'CAMPAIGN_RESUME_FAILED',
                    message: error.message || 'خطأ في استئناف الحملة',
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

