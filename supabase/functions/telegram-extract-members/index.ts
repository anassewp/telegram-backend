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
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
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

        // جلب بيانات المجموعة (استخدام group_id الصحيح)
        const groupResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_groups?group_id=eq.${group_id}&user_id=eq.${user_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!groupResponse.ok) {
            const errorText = await groupResponse.text();
            console.error('خطأ في جلب بيانات المجموعة:', errorText);
            throw new Error(`فشل في جلب بيانات المجموعة: ${errorText}`);
        }

        const groups = await groupResponse.json();
        if (!groups || groups.length === 0) {
            throw new Error(`المجموعة غير موجودة (group_id: ${group_id})`);
        }

        const group = groups[0];
        // تحويل group_id إلى int بشكل صحيح
        let telegram_group_id: number;
        if (typeof group.group_id === 'number') {
            telegram_group_id = group.group_id;
        } else if (typeof group.group_id === 'string') {
            const parsed = parseInt(group.group_id);
            if (isNaN(parsed)) {
                throw new Error(`group_id غير صالح: ${group.group_id}`);
            }
            telegram_group_id = parsed;
        } else {
            throw new Error(`group_id غير صالح: ${group.group_id} (type: ${typeof group.group_id})`);
        }

        // استخراج الأعضاء عبر Backend
        console.log(`استخراج الأعضاء من المجموعة: ${group.title} (group_id: ${telegram_group_id}, type: ${typeof telegram_group_id})`);
        console.log(`TELEGRAM_BACKEND_URL: ${TELEGRAM_BACKEND_URL}`);
        console.log(`Session ID: ${session_id}, User ID: ${user_id}`);
        console.log(`Group username: ${group.username || 'غير متوفر'}`);
        
        // التحقق من أن session_string موجود
        if (!session.session_string) {
            throw new Error('session_string مفقود في بيانات الجلسة');
        }

        // التحقق من api_id و api_hash
        if (!session.api_id || !session.api_hash) {
            throw new Error('api_id أو api_hash مفقود في بيانات الجلسة');
        }

        const requestBody = {
            session_string: session.session_string,
            api_id: String(session.api_id), // تأكد من أن api_id هو string
            api_hash: String(session.api_hash), // تأكد من أن api_hash هو string
            group_id: telegram_group_id, // int
            limit: parseInt(String(limit || 100)), // int
            username: group.username ? String(group.username).replace('@', '') : null  // إزالة @ إذا كان موجوداً
        };

        console.log(`Request body:`, {
            ...requestBody,
            session_string: '***HIDDEN***',
            api_hash: '***HIDDEN***'
        });

        // التحقق من TELEGRAM_BACKEND_URL
        if (!TELEGRAM_BACKEND_URL || TELEGRAM_BACKEND_URL === 'http://localhost:8000') {
            throw new Error('TELEGRAM_BACKEND_URL غير مضبوط. يرجى إضافة Environment Variable في Supabase.');
        }
        
        let extractResponse;
        try {
            const backendUrl = `${TELEGRAM_BACKEND_URL}/members/extract`;
            console.log(`Calling Backend: ${backendUrl}`);
            
            extractResponse = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody),
                // إضافة timeout
                signal: AbortSignal.timeout(120000) // 2 minutes
            });
        } catch (fetchError: any) {
            console.error('خطأ في الاتصال بـ Backend:', fetchError);
            if (fetchError.name === 'AbortError') {
                throw new Error('انتهت مهلة الاتصال بـ Telegram Backend. تحقق من أن Backend يعمل.');
            } else if (fetchError.message?.includes('Connection refused') || fetchError.message?.includes('ECONNREFUSED')) {
                throw new Error(`Telegram Backend غير متاح على: ${TELEGRAM_BACKEND_URL}. تحقق من أن Backend يعمل أو قم بتحديث TELEGRAM_BACKEND_URL في Environment Variables.`);
            } else {
                throw new Error(`خطأ في الاتصال بـ Backend: ${fetchError.message || fetchError}`);
            }
        }

        if (!extractResponse.ok) {
            const errorText = await extractResponse.text();
            console.error('خطأ من Telegram Backend:', {
                status: extractResponse.status,
                statusText: extractResponse.statusText,
                url: `${TELEGRAM_BACKEND_URL}/members/extract`,
                error: errorText.substring(0, 500) // أول 500 حرف فقط
            });
            
            let errorMessage = 'فشل في استخراج الأعضاء من Telegram Backend';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
                // إذا لم يكن JSON، استخدم النص كما هو
                errorMessage = errorText || errorMessage;
            }
            
            // إضافة معلومات إضافية للخطأ
            if (extractResponse.status === 0 || extractResponse.status === 500 || extractResponse.status === 503) {
                throw new Error(`Telegram Backend غير متاح (Status: ${extractResponse.status}). تحقق من: ${TELEGRAM_BACKEND_URL}`);
            } else if (extractResponse.status === 404) {
                throw new Error(`المجموعة غير موجودة أو غير متاحة (group_id: ${telegram_group_id})`);
            } else if (extractResponse.status === 403) {
                throw new Error('لا توجد صلاحيات لعرض أعضاء هذه المجموعة');
            } else if (extractResponse.status === 401) {
                throw new Error('الجلسة منتهية الصلاحية. يرجى إعادة تسجيل الدخول');
            } else {
                throw new Error(`${errorMessage} (Status: ${extractResponse.status})`);
            }
        }

        const extractResult = await extractResponse.json();
        console.log(`Backend Response:`, {
            success: extractResult.success,
            total: extractResult.total,
            members_count: extractResult.members?.length || 0,
            message: extractResult.message
        });

        if (!extractResult.success) {
            const errorMsg = extractResult.message || extractResult.detail || 'فشل في استخراج الأعضاء من Backend';
            console.error('Backend returned success=false:', errorMsg);
            throw new Error(errorMsg);
        }

        if (!extractResult.members || !Array.isArray(extractResult.members)) {
            console.error('Backend did not return valid members array:', extractResult);
            throw new Error('لم يتم إرجاع قائمة أعضاء صالحة من Backend');
        }

        if (extractResult.members.length === 0) {
            console.warn(`لم يتم العثور على أعضاء في المجموعة (group_id: ${telegram_group_id}, title: ${group.title})`);
            console.warn('الأسباب المحتملة:');
            console.warn('1. المستخدم ليس عضواً في المجموعة');
            console.warn('2. المجموعة لا تحتوي على أعضاء');
            console.warn('3. المجموعة مقيدة (restricted)');
            console.warn('4. جميع الأعضاء بوتات (تم تخطيهم)');
            
            return new Response(
                JSON.stringify({
                    data: {
                        total_extracted: 0,
                        inserted: 0,
                        skipped: 0,
                        group_id: telegram_group_id,
                        group_title: group.title,
                        extracted_at: new Date().toISOString(),
                        message: 'لم يتم العثور على أعضاء في المجموعة. تأكد من أنك عضو في المجموعة وأن المجموعة تحتوي على أعضاء.'
                    },
                    warning: 'لم يتم العثور على أعضاء. قد تكون المجموعة فارغة أو المستخدم ليس عضواً فيها.'
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        console.log(`تم استخراج ${extractResult.members.length} عضو من Backend`);

        // حفظ الأعضاء في قاعدة البيانات
        const members = extractResult.members.map((member: any) => {
            // التحقق من telegram_user_id (مطلوب)
            const telegramUserId = member.telegram_user_id || member.id || member.user_id;
            if (!telegramUserId) {
                console.warn('عضو بدون telegram_user_id:', member);
                return null;
            }

            // معالجة access_hash (BIGINT أو null)
            let accessHash = null;
            if (member.access_hash !== null && member.access_hash !== undefined) {
                if (typeof member.access_hash === 'string') {
                    const parsed = parseInt(member.access_hash);
                    accessHash = isNaN(parsed) ? null : parsed;
                } else if (typeof member.access_hash === 'number') {
                    accessHash = member.access_hash;
                }
            }

            return {
                user_id: user_id,
                group_id: telegram_group_id,
                telegram_user_id: telegramUserId,
                username: member.username || null,
                first_name: member.first_name || null,
                last_name: member.last_name || null,
                phone: member.phone || null,
                is_bot: member.is_bot || false,
                is_premium: member.is_premium || false,
                is_verified: member.is_verified || false,
                is_scam: member.is_scam || false,
                is_fake: member.is_fake || false,
                access_hash: accessHash,
                extracted_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }).filter(m => m !== null); // إزالة الأعضاء غير الصالحة

        // إدراج الأعضاء (مع التعامل مع التكرارات)
        let insertedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log(`محاولة إدراج ${members.length} عضو في قاعدة البيانات`);

        // إدراج الأعضاء في مجموعات (batch insert) لتسريع العملية
        const batchSize = 50;
        for (let i = 0; i < members.length; i += batchSize) {
            const batch = members.slice(i, i + batchSize);
            
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
                        body: JSON.stringify(batch)
                    }
                );

                if (insertResponse.ok) {
                    insertedCount += batch.length;
                    console.log(`تم إدراج batch ${Math.floor(i / batchSize) + 1}: ${batch.length} عضو`);
                } else {
                    // إذا فشل batch insert، نحاول إدراج كل عضو على حدة
                    const errorText = await insertResponse.text();
                    console.warn(`Batch insert failed, trying individual inserts. Error: ${errorText.substring(0, 200)}`);
                    
                    for (const member of batch) {
                        try {
                            const individualResponse = await fetch(
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

                            if (individualResponse.ok) {
                                insertedCount++;
                            } else {
                                const individualErrorText = await individualResponse.text();
                                if (individualErrorText.includes('duplicate') || 
                                    individualErrorText.includes('unique') || 
                                    individualErrorText.includes('violates unique constraint')) {
                                    skippedCount++;
                                } else {
                                    errorCount++;
                                    console.error(`خطأ في إدراج عضو ${member.telegram_user_id}:`, individualErrorText.substring(0, 200));
                                }
                            }
                        } catch (error) {
                            errorCount++;
                            console.error(`خطأ في إدراج عضو ${member.telegram_user_id}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.error(`خطأ في batch insert:`, error);
                errorCount += batch.length;
            }
        }

        console.log(`إجمالي: ${insertedCount} تم إدراجها، ${skippedCount} تم تخطيها، ${errorCount} أخطاء`);

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

    } catch (error: any) {
        console.error('خطأ في استخراج الأعضاء:', error);
        console.error('Stack trace:', error.stack);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

        // إرجاع رسالة خطأ مفصلة للمساعدة في التشخيص
        const errorMessage = error.message || 'خطأ في استخراج الأعضاء';
        const errorDetails = {
            code: 'TELEGRAM_EXTRACT_FAILED',
            message: errorMessage,
            timestamp: new Date().toISOString(),
            details: process.env.DENO_ENV === 'development' ? {
                stack: error.stack,
                name: error.name,
                cause: error.cause
            } : undefined
        };

        return new Response(
            JSON.stringify({
                error: errorDetails
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});

