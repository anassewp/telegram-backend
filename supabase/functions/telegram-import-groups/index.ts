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
        console.log('All groups data structure:', groups.map(g => ({
            hasId: !!(g.id || g.group_id),
            id: g.id,
            group_id: g.group_id,
            title: g.title,
            username: g.username,
            type: g.type,
            members_count: g.members_count
        })));

        // Validate and prepare group data
        const validGroups = groups.filter(group => {
            // التحقق من وجود الحقول الأساسية
            if (!group || typeof group !== 'object') {
                console.warn('Invalid group data (not an object):', group);
                return false;
            }
            
            const hasId = group.id || group.group_id;
            const hasTitle = group.title && typeof group.title === 'string' && group.title.trim().length > 0;
            
            // username قد يكون null أو undefined، لكن group_id يجب أن يكون موجوداً
            const hasGroupId = group.group_id !== undefined && group.group_id !== null;
            
            if (!hasId || !hasGroupId) {
                console.warn('Group missing required fields:', {
                    id: group.id,
                    group_id: group.group_id,
                    title: group.title
                });
                return false;
            }
            
            if (!hasTitle) {
                console.warn('Group missing title:', group);
                return false;
            }
            
            return true;
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
                    console.log(`No active sessions found, trying any session for user ${user_id}`);
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
                        } else {
                            console.error(`No sessions found for user ${user_id}`);
                        }
                    } else {
                        const errorText = await anySessionResponse.text();
                        console.error(`Failed to fetch any session: ${anySessionResponse.status} - ${errorText}`);
                    }
                }
            } else {
                const errorText = await sessionResponse.text();
                console.error(`Failed to fetch active sessions: ${sessionResponse.status} - ${errorText}`);
            }
        } catch (e) {
            console.error('Error fetching default session:', e);
            throw new Error(`فشل في جلب الجلسات: ${e instanceof Error ? e.message : String(e)}`);
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
                if (isNaN(parsed)) {
                    console.warn(`Invalid group_id for group ${group.title}: ${groupId}`);
                    return null;  // تخطي المجموعات بدون group_id صحيح
                }
                telegramGroupId = parsed;
            } else if (typeof groupId === 'number') {
                telegramGroupId = groupId;
            } else {
                console.warn(`Missing group_id for group ${group.title}`);
                return null;  // تخطي المجموعات بدون group_id
            }
            
            return {
                user_id: user_id,
                session_id: defaultSessionId,  // session_id مطلوب في قاعدة البيانات
                group_id: telegramGroupId,
                title: group.title || 'Unknown',
                username: group.username || null,
                type: group.type || 'supergroup',
                members_count: group.members_count || 0,
                is_active: true
            };
        }).filter((record): record is NonNullable<typeof record> => record !== null);  // إزالة null values

        // Insert groups into database (one by one to handle duplicates gracefully)
        const insertedGroups: any[] = [];
        let insertedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];
        
        if (groupRecords.length === 0) {
            throw new Error('لا توجد مجموعات صالحة للإدراج بعد التحقق من البيانات');
        }
        
        console.log(`محاولة إدراج ${groupRecords.length} مجموعة في قاعدة البيانات`);
        
        for (const groupRecord of groupRecords) {
            try {
                const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/telegram_groups`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(groupRecord)
                });

                if (insertResponse.ok) {
                    const inserted = await insertResponse.json();
                    insertedGroups.push(inserted[0] || inserted);
                    insertedCount++;
                    console.log(`✓ تم إدراج مجموعة: ${groupRecord.title} (group_id: ${groupRecord.group_id})`);
                } else {
                    const errorText = await insertResponse.text();
                    console.error(`✗ فشل إدراج مجموعة ${groupRecord.title} (group_id: ${groupRecord.group_id}):`, {
                        status: insertResponse.status,
                        statusText: insertResponse.statusText,
                        error: errorText.substring(0, 500)
                    });
                    
                    // إذا كان الخطأ بسبب التكرار (23505)، نتخطى المجموعة
                    if (errorText.includes('23505') || errorText.includes('duplicate key') || errorText.includes('already exists')) {
                        skippedCount++;
                        console.log(`تم تخطي المجموعة المكررة: ${groupRecord.title} (group_id: ${groupRecord.group_id})`);
                    } else {
                        errors.push(`${groupRecord.title}: ${errorText.substring(0, 200)}`);
                        skippedCount++;
                    }
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error(`خطأ في إدراج مجموعة ${groupRecord.title}:`, errorMsg);
                errors.push(`${groupRecord.title}: ${errorMsg}`);
                skippedCount++;
            }
        }
        
        if (errors.length > 0) {
            console.error('أخطاء الإدراج:', errors);
        }

        console.log(`تم استيراد ${insertedCount} مجموعة بنجاح، تم تخطي ${skippedCount} مجموعة`);
        
        if (insertedCount === 0 && skippedCount > 0) {
            const errorMsg = errors.length > 0 
                ? `فشل في إدراج جميع المجموعات. الأخطاء: ${errors.join('; ')}`
                : 'فشل في إدراج جميع المجموعات. تحقق من البيانات والصلاحيات.';
            throw new Error(errorMsg);
        }
        
        if (insertedCount === 0 && skippedCount === 0) {
            throw new Error('لا توجد مجموعات للإدراج. تحقق من صحة البيانات المرسلة.');
        }

        // لا حاجة لتحديث import_status لأن schema الجديد لا يحتوي على هذا الحقل

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Return success response
        const response = {
            data: {
                imported_groups: insertedGroups,
                total_imported: insertedCount,
                skipped: skippedCount,
                user_id: user_id,
                import_summary: {
                    requested_groups: groups.length,
                    valid_groups: validGroups.length,
                    successfully_imported: insertedCount,
                    skipped_groups: skippedCount,
                    failed_imports: groups.length - validGroups.length,
                    status: insertedCount > 0 ? 'completed' : 'partial'
                },
                next_actions: {
                    view_groups: `/dashboard/telegram/groups`,
                    manage_groups: `/dashboard/telegram/groups/manage`,
                    import_more: `/dashboard/telegram/groups/import`
                },
                timestamp: new Date().toISOString()
            }
        };

        console.log(`تم استيراد ${insertedCount} مجموعة بنجاح للمستخدم: ${user_id} (تم تخطي ${skippedCount} مجموعة)`);

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('خطأ في الاستيراد:', error);
        
        // Extract error message safely
        let errorMessage = 'حدث خطأ غير معروف';
        let errorDetails: any = null;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
                name: error.name,
                stack: error.stack
            };
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            errorMessage = (error as any).message || JSON.stringify(error);
            errorDetails = error;
        }
        
        console.error('تفاصيل الخطأ:', {
            message: errorMessage,
            details: errorDetails,
            error: error
        });

        // Return error response
        const errorResponse = {
            error: {
                code: 'TELEGRAM_IMPORT_FAILED',
                message: `خطأ في الاستيراد: ${errorMessage}`,
                details: errorDetails,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});