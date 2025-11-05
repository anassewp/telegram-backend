/**
 * Telegram Send Message Edge Function
 * إرسال رسائل إلى مجموعات Telegram
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const TELEGRAM_BACKEND_URL = Deno.env.get('TELEGRAM_BACKEND_URL') || 'http://localhost:8000';

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Extract parameters from request
        const requestData = await req.json();
        const { 
            campaign_id, 
            user_id, 
            session_id, 
            group_ids, 
            message, 
            schedule_at 
        } = requestData;

        if (!campaign_id || !user_id || !session_id || !group_ids || !message) {
            throw new Error('المعاملات المطلوبة مفقودة');
        }

        if (!Array.isArray(group_ids) || group_ids.length === 0) {
            throw new Error('يجب تحديد مجموعة واحدة على الأقل');
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('إعدادات Supabase مفقودة');
        }

        // جلب بيانات الجلسة
        const sessionResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_sessions?id=eq.${session_id}&user_id=eq.${user_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!sessionResponse.ok) {
            throw new Error('فشل في جلب بيانات الجلسة');
        }

        const sessions = await sessionResponse.json();
        if (!sessions || sessions.length === 0) {
            throw new Error('الجلسة غير موجودة أو غير مصرح بها');
        }

        const session = sessions[0];
        if (session.status !== 'active') {
            throw new Error('الجلسة غير نشطة');
        }

        // جلب بيانات المجموعات
        const groupsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_groups?group_id=in.(${group_ids.join(',')})&user_id=eq.${user_id}`,
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
        if (!groups || groups.length === 0) {
            throw new Error('المجموعات المحددة غير موجودة');
        }

        const results = [];
        const errors = [];

        // إرسال الرسائل إلى كل مجموعة
        for (const group of groups) {
            try {
                // إرسال الرسالة عبر Backend
                const sendResponse = await fetch(`${TELEGRAM_BACKEND_URL}/messages/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        session_string: session.session_string,
                        api_id: session.api_id,
                        api_hash: session.api_hash,
                        group_id: group.telegram_group_id || group.group_id,
                        message: message,
                        schedule_at: schedule_at
                    })
                });

                if (!sendResponse.ok) {
                    const errorData = await sendResponse.json();
                    throw new Error(errorData.detail || 'فشل في إرسال الرسالة');
                }

                const sendResult = await sendResponse.json();

                // حفظ الرسالة في قاعدة البيانات
                const messageRecord = {
                    campaign_id: campaign_id,
                    user_id: user_id,
                    session_id: session_id,
                    group_id: group.telegram_group_id || group.group_id,
                    group_title: group.title,
                    message_text: message,
                    status: sendResult.success ? 'sent' : 'failed',
                    error_message: sendResult.success ? null : sendResult.message,
                    sent_at: sendResult.sent_at || new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const insertResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/telegram_campaign_messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(messageRecord)
                    }
                );

                if (!insertResponse.ok) {
                    console.error('فشل في حفظ الرسالة في قاعدة البيانات');
                }

                results.push({
                    group_id: group.telegram_group_id || group.group_id,
                    group_title: group.title,
                    success: sendResult.success,
                    message_id: sendResult.message_id,
                    sent_at: sendResult.sent_at
                });

            } catch (error) {
                errors.push({
                    group_id: group.telegram_group_id || group.group_id,
                    group_title: group.title,
                    error: error.message || 'خطأ غير معروف'
                });

                // حفظ الرسالة الفاشلة في قاعدة البيانات
                try {
                    const messageRecord = {
                        campaign_id: campaign_id,
                        user_id: user_id,
                        session_id: session_id,
                        group_id: group.telegram_group_id || group.group_id,
                        group_title: group.title,
                        message_text: message,
                        status: 'failed',
                        error_message: error.message || 'خطأ غير معروف',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    await fetch(
                        `${SUPABASE_URL}/rest/v1/telegram_campaign_messages`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(messageRecord)
                        }
                    );
                } catch (dbError) {
                    console.error('فشل في حفظ الرسالة الفاشلة:', dbError);
                }
            }
        }

        // إرجاع النتيجة
        return new Response(
            JSON.stringify({
                data: {
                    total_groups: group_ids.length,
                    successful: results.length,
                    failed: errors.length,
                    results: results,
                    errors: errors
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('خطأ في إرسال الرسائل:', error);

        return new Response(
            JSON.stringify({
                error: {
                    code: 'TELEGRAM_SEND_FAILED',
                    message: error.message || 'خطأ في إرسال الرسائل',
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

