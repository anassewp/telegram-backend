/**
 * Telegram Transfer Members Batch Edge Function
 * نقل دفعة من الأعضاء بين مجموعتين مع توزيع ذكي وتأخير ذكي
 * 
 * This function transfers members between groups with:
 * - Smart distribution across multiple sessions
 * - Smart delays between transfers
 * - Progress tracking in database
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
        return new Response(null, { 
            status: 200, 
            headers: corsHeaders 
        });
    }

    try {
        const requestData = await req.json();
        const {
            user_id,
            session_ids,
            source_group_id,
            target_group_id,
            member_ids,
            distribution_strategy = 'equal',
            delay_min = 60,
            delay_max = 120,
            max_per_day_per_session = 50
        } = requestData;

        // Validation
        if (!user_id || !session_ids || !source_group_id || !target_group_id || !member_ids) {
            throw new Error('المعاملات المطلوبة مفقودة');
        }

        if (!Array.isArray(session_ids) || session_ids.length === 0) {
            throw new Error('يجب تحديد جلسة واحدة على الأقل');
        }

        if (!Array.isArray(member_ids) || member_ids.length === 0) {
            throw new Error('يجب تحديد عضو واحد على الأقل');
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('إعدادات Supabase مفقودة');
        }

        // Validate distribution_strategy
        if (!['equal', 'round_robin', 'random', 'weighted'].includes(distribution_strategy)) {
            throw new Error('distribution_strategy يجب أن يكون: equal, round_robin, random, أو weighted');
        }

        // Load sessions
        const sessionsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_sessions?id=in.(${session_ids.join(',')})&user_id=eq.${user_id}&status=eq.active`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!sessionsResponse.ok) {
            throw new Error('فشل في جلب بيانات الجلسات');
        }

        const sessions = await sessionsResponse.json();
        if (sessions.length === 0) {
            throw new Error('لا توجد جلسات نشطة');
        }

        if (sessions.length !== session_ids.length) {
            throw new Error('بعض الجلسات المحددة غير موجودة أو غير نشطة');
        }

        // Prepare session data for backend
        const apiIds: Record<string, string> = {};
        const apiHashes: Record<string, string> = {};
        const sessionStrings: Record<string, string> = {};

        sessions.forEach((session: any) => {
            apiIds[session.id] = session.api_id;
            apiHashes[session.id] = session.api_hash;
            sessionStrings[session.id] = session.session_string;
        });

        // Call backend API for batch transfer
        const backendResponse = await fetch(`${TELEGRAM_BACKEND_URL}/members/transfer-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_ids: session_ids,
                api_ids: apiIds,
                api_hashes: apiHashes,
                session_strings: sessionStrings,
                source_group_id: source_group_id,
                target_group_id: target_group_id,
                member_ids: member_ids,
                distribution_strategy: distribution_strategy,
                delay_min: delay_min,
                delay_max: delay_max,
                max_per_day_per_session: max_per_day_per_session
            })
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json();
            throw new Error(errorData.detail || 'فشل في نقل الأعضاء');
        }

        const backendResult = await backendResponse.json();

        // Save transfer records to database
        const transferRecords = [];

        // Save successful transfers
        if (backendResult.transferred && Array.isArray(backendResult.transferred)) {
            for (const transfer of backendResult.transferred) {
                transferRecords.push({
                    user_id: user_id,
                    source_group_id: source_group_id,
                    target_group_id: target_group_id,
                    session_id: transfer.session_id || session_ids[0],
                    member_telegram_id: transfer.member_id || transfer.telegram_user_id,
                    status: 'transferred',
                    transferred_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }

        // Save failed transfers
        if (backendResult.failed && Array.isArray(backendResult.failed)) {
            for (const failure of backendResult.failed) {
                transferRecords.push({
                    user_id: user_id,
                    source_group_id: source_group_id,
                    target_group_id: target_group_id,
                    session_id: failure.session_id || session_ids[0],
                    member_telegram_id: failure.member_id || failure.telegram_user_id,
                    status: 'failed',
                    error_message: failure.error || 'خطأ غير معروف',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }

        // Insert transfer records
        if (transferRecords.length > 0) {
            await fetch(`${SUPABASE_URL}/rest/v1/telegram_member_transfers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(transferRecords)
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `تم نقل ${backendResult.total_transferred || 0} عضو بنجاح`,
                data: {
                    total_requested: backendResult.total_requested || member_ids.length,
                    total_transferred: backendResult.total_transferred || 0,
                    total_failed: backendResult.total_failed || 0,
                    session_results: backendResult.session_results || {}
                },
                transferred: backendResult.transferred || [],
                failed: backendResult.failed || []
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        console.error('خطأ في نقل الأعضاء:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'TRANSFER_MEMBERS_BATCH_FAILED',
                    message: error.message || 'خطأ في نقل الأعضاء',
                    timestamp: new Date().toISOString()
                }
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});

