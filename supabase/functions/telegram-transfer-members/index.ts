/**
 * Telegram Transfer Members Edge Function
 * نقل أعضاء بين مجموعات Telegram
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
            user_id, 
            session_id, 
            source_group_id, 
            target_group_id, 
            member_ids 
        } = requestData;

        if (!user_id || !session_id || !source_group_id || !target_group_id || !member_ids) {
            throw new Error('المعاملات المطلوبة مفقودة');
        }

        if (!Array.isArray(member_ids) || member_ids.length === 0) {
            throw new Error('يجب تحديد عضو واحد على الأقل');
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

        // التحقق من وجود الأعضاء في المجموعة المصدر
        const membersResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_members?user_id=eq.${user_id}&group_id=eq.${source_group_id}&telegram_user_id=in.(${member_ids.join(',')})`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!membersResponse.ok) {
            throw new Error('فشل في التحقق من الأعضاء');
        }

        const members = await membersResponse.json();
        if (!members || members.length === 0) {
            throw new Error('لم يتم العثور على الأعضاء المحددة في المجموعة المصدر');
        }

        // نقل الأعضاء عبر Backend
        const transferResponse = await fetch(`${TELEGRAM_BACKEND_URL}/members/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_string: session.session_string,
                api_id: session.api_id,
                api_hash: session.api_hash,
                source_group_id: source_group_id,
                target_group_id: target_group_id,
                member_ids: member_ids
            })
        });

        if (!transferResponse.ok) {
            const errorData = await transferResponse.json();
            throw new Error(errorData.detail || 'فشل في نقل الأعضاء');
        }

        const transferResult = await transferResponse.json();

        if (!transferResult.success) {
            throw new Error('فشل في نقل الأعضاء');
        }

        // تحديث بيانات الأعضاء في قاعدة البيانات (نقل من مجموعة إلى أخرى)
        const transferredIds = transferResult.transferred.map((m: any) => m.telegram_user_id);
        
        if (transferredIds.length > 0) {
            // تحديث group_id للأعضاء المنقولة
            const updatePromises = transferredIds.map(async (memberId: number) => {
                const updateResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/telegram_members?user_id=eq.${user_id}&telegram_user_id=eq.${memberId}&group_id=eq.${source_group_id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            group_id: target_group_id,
                            updated_at: new Date().toISOString()
                        })
                    }
                );

                if (!updateResponse.ok) {
                    console.warn(`فشل في تحديث عضو ${memberId}`);
                }
            });

            await Promise.all(updatePromises);
        }

        // إرجاع النتيجة
        return new Response(
            JSON.stringify({
                data: {
                    total_requested: transferResult.total_requested,
                    total_transferred: transferResult.total_transferred,
                    total_failed: transferResult.total_failed,
                    transferred: transferResult.transferred,
                    failed: transferResult.failed,
                    transferred_at: new Date().toISOString()
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('خطأ في نقل الأعضاء:', error);

        return new Response(
            JSON.stringify({
                error: {
                    code: 'TELEGRAM_TRANSFER_FAILED',
                    message: error.message || 'خطأ في نقل الأعضاء',
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

