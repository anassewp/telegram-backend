/**
 * Telegram Global Search Edge Function
 * البحث العالمي في مجموعات Telegram
 * 
 * This function uses the Python Telegram Backend to search for real groups.
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
        const { query, limit = 10, offset = 0, session_id, user_id, api_id, api_hash, session_string } = requestData;

        if (!query) {
            throw new Error('البحث مطلوب - Query is required');
        }

        if (!session_string || !api_id || !api_hash) {
            throw new Error('معلومات الجلسة مطلوبة (session_string, api_id, api_hash)');
        }

        console.log(`البحث عن المجموعات: "${query}"`);
        console.log('TELEGRAM_BACKEND_URL:', TELEGRAM_BACKEND_URL);
        console.log('Session ID:', session_id);
        console.log('API ID:', api_id ? 'موجود' : 'مفقود');

        // التحقق من أن TELEGRAM_BACKEND_URL موجود
        if (!TELEGRAM_BACKEND_URL || TELEGRAM_BACKEND_URL === 'http://localhost:8000') {
            console.warn('⚠️ TELEGRAM_BACKEND_URL غير مضبوط أو يشير إلى localhost');
            console.warn('⚠️ تأكد من إضافة TELEGRAM_BACKEND_URL في Environment Variables');
        }

        // استدعاء Python Backend للبحث الحقيقي
        let backendData;
        try {
            const backendResponse = await fetch(`${TELEGRAM_BACKEND_URL}/groups/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_string: session_string,
                    api_id: api_id,
                    api_hash: api_hash,
                    query: query,
                    limit: limit || 20,
                    groups_only: true
                }),
                signal: AbortSignal.timeout(30000) // timeout 30 seconds
            });

            if (!backendResponse.ok) {
                const errorText = await backendResponse.text();
                console.error('خطأ من Telegram Backend:', {
                    status: backendResponse.status,
                    statusText: backendResponse.statusText,
                    error: errorText
                });

                if (backendResponse.status === 0 || backendResponse.status === 500 || backendResponse.status === 503) {
                    throw new Error(`Telegram Backend غير متاح. تحقق من: ${TELEGRAM_BACKEND_URL} - تأكد من أن Backend يعمل أو قم بتحديث TELEGRAM_BACKEND_URL في Environment Variables`);
                }

                throw new Error(`فشل البحث في Backend: ${errorText}`);
            }

            backendData = await backendResponse.json();

            // التحقق من البيانات المستلمة
            if (!backendData) {
                throw new Error('لم يتم استلام بيانات من Backend');
            }

            if (!backendData.success || !backendData.data || !Array.isArray(backendData.data.groups)) {
                throw new Error('لم يتم إرجاع نتائج صالحة من Backend');
            }

            console.log(`تم العثور على ${backendData.data.groups.length} مجموعة للبحث: "${query}"`);
        } catch (fetchError) {
            console.error('خطأ في الاتصال بـ Backend:', fetchError);
            
            if (fetchError.name === 'TimeoutError' || fetchError.message?.includes('timeout')) {
                throw new Error(`انتهت مهلة الاتصال بـ Telegram Backend. تحقق من: ${TELEGRAM_BACKEND_URL}`);
            }
            
            if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('ECONNREFUSED')) {
                throw new Error(`لا يمكن الاتصال بـ Telegram Backend على ${TELEGRAM_BACKEND_URL}. تأكد من أن Backend يعمل وأن TELEGRAM_BACKEND_URL صحيح في Environment Variables.`);
            }
            
            throw fetchError;
        }

        // Return success response
        const response = {
            data: {
                groups: backendData.data.groups,
                total: backendData.data.total || backendData.data.groups.length,
                query: query,
                has_more: backendData.data.has_more || false,
                next_offset: offset + limit,
                search_metadata: backendData.data.search_metadata || {
                    timestamp: new Date().toISOString(),
                    api_version: "1.0",
                    results_per_page: limit
                }
            }
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('خطأ في البحث:', error);

        // Return error response
        const errorResponse = {
            error: {
                code: 'TELEGRAM_SEARCH_FAILED',
                message: `خطأ في البحث: ${error.message}`,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});