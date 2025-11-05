/**
 * Telegram Join Group Edge Function
 * الانضمام إلى مجموعات Telegram
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
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const requestData = await req.json();
        const { 
            user_id, 
            session_id, 
            group_id,
            username,
            invite_link
        } = requestData;

        if (!user_id || !session_id) {
            throw new Error('user_id و session_id مطلوبان');
        }

        if (!group_id && !username && !invite_link) {
            throw new Error('يجب توفير group_id أو username أو invite_link');
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

        if (!session.session_string) {
            throw new Error('session_string مفقود في بيانات الجلسة');
        }

        // استدعاء Backend للانضمام
        console.log(`الانضمام إلى المجموعة: group_id=${group_id}, username=${username}`);
        
        const joinResponse = await fetch(`${TELEGRAM_BACKEND_URL}/groups/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_string: session.session_string,
                api_id: session.api_id,
                api_hash: session.api_hash,
                group_id: group_id || null,
                username: username || null,
                invite_link: invite_link || null
            }),
            signal: AbortSignal.timeout(60000) // 1 minute
        });

        if (!joinResponse.ok) {
            const errorText = await joinResponse.text();
            console.error('خطأ من Telegram Backend:', {
                status: joinResponse.status,
                statusText: joinResponse.statusText,
                error: errorText.substring(0, 500)
            });
            
            let errorMessage = 'فشل في الانضمام للمجموعة';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }
            
            if (joinResponse.status === 404) {
                throw new Error('المجموعة غير موجودة');
            } else if (joinResponse.status === 400) {
                throw new Error(errorMessage);
            } else if (joinResponse.status === 403) {
                throw new Error('لا توجد صلاحيات للانضمام لهذه المجموعة');
            } else {
                throw new Error(`${errorMessage} (Status: ${joinResponse.status})`);
            }
        }

        const joinResult = await joinResponse.json();
        console.log(`تم الانضمام بنجاح: ${joinResult.group_title}`);

        return new Response(
            JSON.stringify({
                data: {
                    success: true,
                    message: joinResult.message,
                    group_id: joinResult.group_id,
                    group_title: joinResult.group_title,
                    username: joinResult.username
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        console.error('خطأ في الانضمام للمجموعة:', error);

        return new Response(
            JSON.stringify({
                error: {
                    code: 'TELEGRAM_JOIN_FAILED',
                    message: error.message || 'خطأ في الانضمام للمجموعة',
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

