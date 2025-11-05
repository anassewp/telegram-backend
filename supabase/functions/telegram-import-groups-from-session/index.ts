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

        // التحقق من أن TELEGRAM_BACKEND_URL موجود
        if (!TELEGRAM_BACKEND_URL || TELEGRAM_BACKEND_URL === 'http://localhost:8000') {
            const errorMsg = 'TELEGRAM_BACKEND_URL غير مضبوط. يرجى إضافة TELEGRAM_BACKEND_URL في Supabase Environment Variables (Settings > Edge Functions > Environment Variables)';
            console.error('⚠️', errorMsg);
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'TELEGRAM_BACKEND_URL_MISSING',
                    message: errorMsg,
                    timestamp: new Date().toISOString()
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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
        // Backend endpoint: POST /groups/import/{session_id}?api_id=xxx&api_hash=xxx&session_string=xxx
        const url = new URL(`${TELEGRAM_BACKEND_URL}/groups/import/${session_id}`);
        url.searchParams.append('api_id', api_id.toString());
        url.searchParams.append('api_hash', api_hash);
        url.searchParams.append('session_string', session_string);

        console.log('Calling Backend URL:', url.toString().replace(session_string, '***HIDDEN***'));

        let backendResponse;
        try {
            backendResponse = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(60000) // timeout 60 seconds
            });
        } catch (fetchError) {
            console.error('خطأ في الاتصال بـ Backend:', fetchError);
            
            let errorMsg = 'فشل في الاتصال بـ Telegram Backend';
            if (fetchError.name === 'TimeoutError' || fetchError.message?.includes('timeout')) {
                errorMsg = `انتهت مهلة الاتصال بـ Telegram Backend (60 ثانية). تحقق من: ${TELEGRAM_BACKEND_URL}`;
            } else if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('ECONNREFUSED')) {
                errorMsg = `لا يمكن الاتصال بـ Telegram Backend على ${TELEGRAM_BACKEND_URL}. تأكد من أن Backend يعمل وأن TELEGRAM_BACKEND_URL صحيح في Environment Variables.`;
            }
            
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'TELEGRAM_BACKEND_CONNECTION_FAILED',
                    message: errorMsg,
                    timestamp: new Date().toISOString()
                }
            }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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

        // استيراد جميع المجموعات والقنوات بدون أي فلترة
        // لا نستبعد أي مجموعات أو قنوات
        const filteredGroups = backendData.groups;  // جميع المجموعات بدون فلترة

        console.log(`استيراد جميع المجموعات والقنوات: ${filteredGroups.length} مجموعة/قناة`);

        if (filteredGroups.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                groups: [],
                total: 0,
                message: 'لم يتم العثور على مجموعات أو قنوات'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // حفظ المجموعات في قاعدة البيانات (مع معالجة التكرارات)
        let insertedCount = 0;
        let skippedCount = 0;
        const insertedGroups: any[] = [];

        // إدراج المجموعات واحدة تلو الأخرى لتجنب التكرارات
        for (const group of filteredGroups) {
            // بناء groupRecord مع الحقول الأساسية
            const groupRecord: any = {
                user_id: user_id,
                session_id: session_id,
                group_id: group.group_id,
                title: group.title || '',
                username: group.username || null,
                members_count: group.members_count || 0,
                type: group.type || 'group',
                is_active: true
            };

            // إضافة الحقول الجديدة للفلترة (إذا كانت موجودة في Backend response)
            if (group.members_visible !== undefined) {
                groupRecord.members_visible = group.members_visible;
            }
            
            // إضافة members_visibility_type إذا كان موجوداً في Backend أو استخراجه من members_visible
            if (group.members_visibility_type) {
                groupRecord.members_visibility_type = group.members_visibility_type;
            } else if (group.members_visible !== undefined) {
                // Fallback: تحويل members_visible إلى members_visibility_type
                groupRecord.members_visibility_type = group.members_visible ? 'fully_visible' : 'hidden';
            }

            if (group.is_private !== undefined) {
                groupRecord.is_private = group.is_private;
            }
            if (group.is_restricted !== undefined) {
                groupRecord.is_restricted = group.is_restricted;
            }
            if (group.can_send !== undefined) {
                groupRecord.can_send = group.can_send;
            }
            if (group.is_closed !== undefined) {
                groupRecord.is_closed = group.is_closed;
            }

            try {
                // محاولة الإدراج مع جميع الحقول
                let insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/telegram_groups`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(groupRecord)
                });

                if (!insertResponse.ok) {
                    const errorText = await insertResponse.text();
                    console.error(`خطأ في إدراج مجموعة ${group.title}:`, {
                        status: insertResponse.status,
                        statusText: insertResponse.statusText,
                        error: errorText.substring(0, 500)
                    });
                    
                    // إذا كان الخطأ بسبب التكرار (23505)، نتخطى المجموعة
                    if (errorText.includes('23505') || errorText.includes('duplicate key') || errorText.includes('already exists')) {
                        skippedCount++;
                        console.log(`تم تخطي المجموعة المكررة: ${group.title} (group_id: ${group.group_id})`);
                        continue;
                    }
                    
                    // إذا كان الخطأ بسبب حقل غير موجود، نحاول بدون الحقول الاختيارية
                    if (errorText.includes('column') && (errorText.includes('does not exist') || errorText.includes('not exist'))) {
                        console.warn(`حقل غير موجود في قاعدة البيانات، محاولة بدون الحقول الاختيارية: ${group.title}`);
                        
                        // بناء سجل أدنى مع الحقول الأساسية فقط
                        const minimalRecord: any = {
                            user_id: user_id,
                            session_id: session_id,
                            group_id: group.group_id,
                            title: group.title || '',
                            username: group.username || null,
                            members_count: group.members_count || 0,
                            type: group.type || 'group',
                            is_active: true
                        };
                        
                        // محاولة إضافة الحقول الأساسية فقط (إذا كانت موجودة)
                        // نحاول إضافة members_visible فقط (لأنه موجود في migration 20250105)
                        if (group.members_visible !== undefined) {
                            minimalRecord.members_visible = group.members_visible;
                        }
                        
                        insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/telegram_groups`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify(minimalRecord)
                        });
                        
                        if (!insertResponse.ok) {
                            const retryErrorText = await insertResponse.text();
                            console.error(`فشلت المحاولة الثانية لإدراج ${group.title}:`, retryErrorText.substring(0, 500));
                            
                            // إذا كان الخطأ تكرار، نتخطاه
                            if (retryErrorText.includes('23505') || retryErrorText.includes('duplicate key')) {
                                skippedCount++;
                            } else {
                                skippedCount++;
                            }
                            continue;
                        }
                    } else {
                        // خطأ آخر غير متوقع
                        skippedCount++;
                        continue;
                    }
                }

                // إذا نجح الإدراج
                const inserted = await insertResponse.json();
                insertedGroups.push(inserted[0] || inserted);
                insertedCount++;
                
            } catch (error) {
                console.error(`خطأ في إدراج مجموعة ${group.title}:`, error);
                skippedCount++;
            }
        }

        console.log(`تم إدراج ${insertedCount} مجموعة، تم تخطي ${skippedCount} مجموعة`);

        // Return success response
        const response = {
            success: true,
            groups: insertedGroups,
            total: insertedGroups.length,
            inserted: insertedCount,
            skipped: skippedCount,
            message: `تم استيراد ${insertedCount} مجموعة بنجاح${skippedCount > 0 ? ` (تم تخطي ${skippedCount} مجموعة مكررة)` : ''}`
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

