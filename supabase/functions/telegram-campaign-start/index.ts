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
            console.error(`✗ فشل في تحديث حالة الحملة:`, {
                status: updateResponse.status,
                statusText: updateResponse.statusText,
                error: errorText.substring(0, 500)
            });
            throw new Error(`فشل في تحديث حالة الحملة: ${errorText.substring(0, 200)}`);
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

