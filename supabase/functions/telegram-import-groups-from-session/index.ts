/**
 * Telegram Import Groups From Session Edge Function
 * استيراد مجموعات Telegram من جلسة معينة
 * 
 * This function imports Telegram groups from a specific session using the Telegram Backend
 * استيراد مجموعات Telegram من جلسة معينة باستخدام Telegram Backend
 */

const TELEGRAM_BACKEND_URL = Deno.env.get('TELEGRAM_BACKEND_URL') || 'http://localhost:8000';
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
        // Extract parameters from request body
        const requestData = await req.json();
        const { session_id, user_id, api_id, api_hash, session_string } = requestData;

        if (!session_id || !user_id || !api_id || !api_hash || !session_string) {
            throw new Error('جميع المعاملات مطلوبة (session_id, user_id, api_id, api_hash, session_string)');
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('إعدادات Supabase مفقودة:', {
                SUPABASE_URL: SUPABASE_URL ? 'موجود' : 'مفقود',
                SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? 'موجود' : 'مفقود'
            });
            throw new Error('إعدادات Supabase مفقودة - تحقق من Environment Variables');
        }

        console.log(`استيراد مجموعات من الجلسة: ${session_id} للمستخدم: ${user_id}`);
        console.log('TELEGRAM_BACKEND_URL:', TELEGRAM_BACKEND_URL);

        // التحقق من الجلسة في قاعدة البيانات
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

        // استدعاء Telegram Backend لاستيراد المجموعات
        const url = new URL(`${TELEGRAM_BACKEND_URL}/groups/import/${session_id}`);
        url.searchParams.append('api_id', api_id);
        url.searchParams.append('api_hash', api_hash);
        url.searchParams.append('session_string', session_string);

        const backendResponse = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error('خطأ من Telegram Backend:', {
                status: backendResponse.status,
                statusText: backendResponse.statusText,
                url: url.toString(),
                error: errorText
            });
            
            // إذا كان Backend غير متاح
            if (backendResponse.status === 0 || backendResponse.status === 500 || backendResponse.status === 503) {
                throw new Error(`Telegram Backend غير متاح. تحقق من: ${TELEGRAM_BACKEND_URL} - تأكد من أن Backend يعمل أو قم بتحديث TELEGRAM_BACKEND_URL في Environment Variables`);
            }
            
            throw new Error(`فشل في استيراد المجموعات من Backend: ${errorText}`);
        }

        const backendData = await backendResponse.json();

        if (!backendData.success || !backendData.groups || !Array.isArray(backendData.groups)) {
            throw new Error('لم يتم إرجاع مجموعات صالحة من Backend');
        }

        console.log(`تم جلب ${backendData.groups.length} مجموعة من Backend`);

        // حفظ المجموعات في قاعدة البيانات
        const groupRecords = backendData.groups.map((group: any) => ({
            user_id: user_id,
            session_id: session_id,
            group_id: group.group_id,
            title: group.title || '',
            username: group.username || null,
            members_count: group.members_count || 0,
            type: group.type || 'group',
            is_active: true
        }));

        // إدراج المجموعات في قاعدة البيانات
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/telegram_groups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(groupRecords)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('خطأ في قاعدة البيانات:', errorText);
            throw new Error(`فشل في حفظ المجموعات: ${errorText}`);
        }

        const insertedGroups = await insertResponse.json();
        console.log(`تم استيراد ${insertedGroups.length} مجموعة بنجاح`);

        // Return success response
        const response = {
            success: true,
            groups: insertedGroups,
            total: insertedGroups.length,
            message: `تم استيراد ${insertedGroups.length} مجموعة بنجاح`
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('خطأ في الاستيراد:', error);

        // Return error response
        const errorResponse = {
            success: false,
            error: {
                code: 'TELEGRAM_IMPORT_FAILED',
                message: `خطأ في الاستيراد: ${error.message}`,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

