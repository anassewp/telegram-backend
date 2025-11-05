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

        // Validate and prepare group data
        const validGroups = groups.filter(group => {
            return group && 
                   group.id && 
                   group.title && 
                   group.username &&
                   (group.type === 'group' || group.type === 'supergroup' || group.type === 'channel');
        });

        if (validGroups.length === 0) {
            throw new Error('لا توجد مجموعات صالحة للاستيراد - No valid groups to import');
        }

        console.log(`تم التحقق من ${validGroups.length} مجموعة صالحة للاستيراد`);

        // Prepare group records for database insertion
        const groupRecords = validGroups.map(group => ({
            telegram_group_id: group.id,
            title: group.title,
            username: group.username,
            type: group.type,
            description: group.description || '',
            members_count: group.members_count || 0,
            photo_url: group.photo || '',
            is_public: group.is_public !== false,
            verified: group.verified || false,
            invite_link: group.invite_link || group.invitations_link || `https://t.me/${group.username}`,
            language: group.language || 'unknown',
            region: group.region || 'unknown',
            category: group.category || 'General',
            imported_by: user_id,
            import_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

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

        // Update import status for all groups
        const updatePromises = insertedGroups.map(async (group) => {
            const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/telegram_groups?id=eq.${group.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    import_status: 'imported',
                    imported_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                console.warn(`فشل في تحديث حالة المجموعة ${group.id}`);
            }
        });

        await Promise.all(updatePromises);

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