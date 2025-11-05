/**
 * Telegram Import Groups Edge Function
 * استيراد مجموعات Telegram
 * 
 * This function imports selected Telegram groups into the user's account
 * استيراد مجموعات Telegram المحددة إلى حساب المستخدم
 */

const TELEGRAM_API_ID = Deno.env.get('TELEGRAM_API_ID');
const TELEGRAM_API_HASH = Deno.env.get('TELEGRAM_API_HASH');
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
        const { groups, user_id } = requestData;

        if (!groups || !Array.isArray(groups) || groups.length === 0) {
            throw new Error('قائمة المجموعات مطلوبة - Groups list is required');
        }

        if (!user_id) {
            throw new Error('معرف المستخدم مطلوب - User ID is required');
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('إعدادات Supabase مفقودة - Supabase configuration missing');
        }

        console.log(`استيراد ${groups.length} مجموعة للمستخدم: ${user_id}`);
        console.log('Sample group data:', JSON.stringify(groups[0] || {}, null, 2));

        // Validate and prepare group data
        const validGroups = groups.filter(group => {
            // التحقق من وجود الحقول الأساسية
            const hasId = group && (group.id || group.group_id);
            const hasTitle = group && group.title;
            // username قد يكون null لكن يجب أن يكون موجوداً في object
            const hasUsername = group && 'username' in group;
            
            return hasId && hasTitle && hasUsername;
        });

        if (validGroups.length === 0) {
            console.error('No valid groups found. First group:', groups[0]);
            throw new Error('لا توجد مجموعات صالحة للاستيراد - No valid groups to import');
        }

        console.log(`تم التحقق من ${validGroups.length} مجموعة صالحة للاستيراد`);

        // الحصول على أول جلسة نشطة للمستخدم (للمجموعات المستوردة من البحث)
        // session_id مطلوب في قاعدة البيانات، لذلك يجب أن نجد جلسة نشطة
        let defaultSessionId = null;
        try {
            const sessionResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/telegram_sessions?user_id=eq.${user_id}&status=eq.active&limit=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (sessionResponse.ok) {
                const sessions = await sessionResponse.json();
                if (sessions && sessions.length > 0) {
                    defaultSessionId = sessions[0].id;
                    console.log(`Using default session: ${defaultSessionId}`);
                } else {
                    // إذا لم توجد جلسة نشطة، نحاول أي جلسة
                    const anySessionResponse = await fetch(
                        `${SUPABASE_URL}/rest/v1/telegram_sessions?user_id=eq.${user_id}&limit=1`,
                        {
                            headers: {
                                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    if (anySessionResponse.ok) {
                        const anySessions = await anySessionResponse.json();
                        if (anySessions && anySessions.length > 0) {
                            defaultSessionId = anySessions[0].id;
                            console.log(`Using any available session: ${defaultSessionId}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Could not fetch default session:', e);
        }
        
        if (!defaultSessionId) {
            throw new Error('لا توجد جلسة Telegram نشطة. يرجى إضافة جلسة أولاً من صفحة "إدارة الجلسات"');
        }

        // Prepare group records for database insertion
        const groupRecords = validGroups.map(group => {
            // استخدام group_id إذا كان موجوداً، وإلا استخدم id
            const groupId = group.group_id || group.id;
            // تحويل group_id إلى number إذا كان string
            let telegramGroupId: number;
            if (typeof groupId === 'string') {
                const parsed = parseInt(groupId);
                telegramGroupId = isNaN(parsed) ? 0 : parsed;
            } else {
                telegramGroupId = groupId;
            }
            
            return {
                user_id: user_id,
                session_id: defaultSessionId,  // session_id مطلوب في قاعدة البيانات
                group_id: telegramGroupId,
                title: group.title,
                username: group.username || null,
                type: group.type || 'supergroup',
                members_count: group.members_count || 0,
                is_active: true
            };
        });

        // Insert groups into database using service role key
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

        // لا حاجة لتحديث import_status لأن schema الجديد لا يحتوي على هذا الحقل

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Return success response
        const response = {
            data: {
                imported_groups: insertedGroups,
                total_imported: insertedGroups.length,
                user_id: user_id,
                import_summary: {
                    requested_groups: groups.length,
                    valid_groups: validGroups.length,
                    successfully_imported: insertedGroups.length,
                    failed_imports: groups.length - validGroups.length,
                    status: 'completed'
                },
                next_actions: {
                    view_groups: `/dashboard/telegram/groups`,
                    manage_groups: `/dashboard/telegram/groups/manage`,
                    import_more: `/dashboard/telegram/groups/import`
                },
                timestamp: new Date().toISOString()
            }
        };

        console.log(`تم استيراد ${insertedGroups.length} مجموعة بنجاح للمستخدم: ${user_id}`);

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('خطأ في الاستيراد:', error);

        // Return error response
        const errorResponse = {
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