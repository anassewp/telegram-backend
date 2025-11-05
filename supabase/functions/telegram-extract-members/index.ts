/**
 * Telegram Extract Members Edge Function
 * استخراج أعضاء من مجموعات Telegram
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
            group_id, 
            limit = 100 
        } = requestData;

        if (!user_id || !session_id || !group_id) {
            throw new Error('المعاملات المطلوبة مفقودة');
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

        // جلب بيانات المجموعة
        const groupResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_groups?telegram_group_id=eq.${group_id}&user_id=eq.${user_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!groupResponse.ok) {
            throw new Error('فشل في جلب بيانات المجموعة');
        }

        const groups = await groupResponse.json();
        if (!groups || groups.length === 0) {
            throw new Error('المجموعة غير موجودة');
        }

        const group = groups[0];
        const telegram_group_id = group.telegram_group_id || group.group_id;

        // استخراج الأعضاء عبر Backend
        const extractResponse = await fetch(`${TELEGRAM_BACKEND_URL}/members/extract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_string: session.session_string,
                api_id: session.api_id,
                api_hash: session.api_hash,
                group_id: telegram_group_id,
                limit: limit
            })
        });

        if (!extractResponse.ok) {
            const errorData = await extractResponse.json();
            throw new Error(errorData.detail || 'فشل في استخراج الأعضاء');
        }

        const extractResult = await extractResponse.json();

        if (!extractResult.success || !extractResult.members) {
            throw new Error('فشل في استخراج الأعضاء');
        }

        // حفظ الأعضاء في قاعدة البيانات
        const members = extractResult.members.map((member: any) => ({
            user_id: user_id,
            group_id: telegram_group_id,
            telegram_user_id: member.telegram_user_id,
            username: member.username || null,
            first_name: member.first_name || null,
            last_name: member.last_name || null,
            phone: member.phone || null,
            is_bot: member.is_bot || false,
            is_premium: member.is_premium || false,
            is_verified: member.is_verified || false,
            is_scam: member.is_scam || false,
            is_fake: member.is_fake || false,
            access_hash: member.access_hash || null,
            extracted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        // إدراج الأعضاء (مع التعامل مع التكرارات)
        let insertedCount = 0;
        let skippedCount = 0;

        for (const member of members) {
            try {
                const insertResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/telegram_members`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify(member)
                    }
                );

                if (insertResponse.ok) {
                    insertedCount++;
                } else {
                    // إذا كان الخطأ بسبب التكرار (unique constraint)
                    const errorText = await insertResponse.text();
                    if (errorText.includes('duplicate') || errorText.includes('unique')) {
                        skippedCount++;
                    } else {
                        console.error('خطأ في إدراج عضو:', errorText);
                    }
                }
            } catch (error) {
                console.error('خطأ في إدراج عضو:', error);
            }
        }

        // إرجاع النتيجة
        return new Response(
            JSON.stringify({
                data: {
                    total_extracted: extractResult.total,
                    inserted: insertedCount,
                    skipped: skippedCount,
                    group_id: telegram_group_id,
                    group_title: group.title,
                    extracted_at: new Date().toISOString()
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('خطأ في استخراج الأعضاء:', error);

        return new Response(
            JSON.stringify({
                error: {
                    code: 'TELEGRAM_EXTRACT_FAILED',
                    message: error.message || 'خطأ في استخراج الأعضاء',
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

