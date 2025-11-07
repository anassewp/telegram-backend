/**
 * Telegram Campaign Send Batch Edge Function
 * إرسال دفعة من الرسائل للحملة مع توزيع ذكي وتأخير ذكي
 * 
 * This function handles sending a batch of messages for a campaign with:
 * - Smart distribution across sessions
 * - Smart delays between messages
 * - Member filtering
 * - Message personalization
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const TELEGRAM_BACKEND_URL = Deno.env.get('TELEGRAM_BACKEND_URL') || 'http://localhost:8000';

// Helper function to calculate smart delay
function smartDelay(minSeconds: number, maxSeconds: number, variation: boolean = true): number {
    if (minSeconds >= maxSeconds) {
        return minSeconds;
    }
    
    if (variation) {
        // Add random variation (±20%)
        const range = maxSeconds - minSeconds;
        const variationAmount = range * 0.2;
        const adjustedMin = Math.max(1, minSeconds - variationAmount);
        const adjustedMax = maxSeconds + variationAmount;
        return Math.floor(adjustedMin + Math.random() * (adjustedMax - adjustedMin));
    }
    
    return Math.floor(minSeconds + Math.random() * (maxSeconds - minSeconds));
}

// Helper function to distribute tasks
function distributeTasks(tasks: any[], sessionIds: string[], strategy: string = 'equal'): Record<string, any[]> {
    const distribution: Record<string, any[]> = {};
    sessionIds.forEach(id => distribution[id] = []);
    
    if (!sessionIds.length || !tasks.length) {
        return distribution;
    }
    
    if (strategy === 'equal') {
        const tasksPerSession = Math.floor(tasks.length / sessionIds.length);
        const remainder = tasks.length % sessionIds.length;
        
        let startIdx = 0;
        sessionIds.forEach((sessionId, i) => {
            const endIdx = startIdx + tasksPerSession + (i < remainder ? 1 : 0);
            distribution[sessionId] = tasks.slice(startIdx, endIdx);
            startIdx = endIdx;
        });
    } else if (strategy === 'round_robin') {
        tasks.forEach((task, i) => {
            const sessionId = sessionIds[i % sessionIds.length];
            distribution[sessionId].push(task);
        });
    } else if (strategy === 'random') {
        tasks.forEach(task => {
            const sessionId = sessionIds[Math.floor(Math.random() * sessionIds.length)];
            distribution[sessionId].push(task);
        });
    } else {
        // weighted - default to equal
        const tasksPerSession = Math.floor(tasks.length / sessionIds.length);
        const remainder = tasks.length % sessionIds.length;
        
        let startIdx = 0;
        sessionIds.forEach((sessionId, i) => {
            const endIdx = startIdx + tasksPerSession + (i < remainder ? 1 : 0);
            distribution[sessionId] = tasks.slice(startIdx, endIdx);
            startIdx = endIdx;
        });
    }
    
    return distribution;
}

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

    let requestData: any = null;

    try {
        requestData = await req.json();
        const { campaign_id, user_id, batch_size = 10 } = requestData;

        console.log('========== إرسال دفعة من الرسائل ==========');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Request received:', {
            campaign_id: campaign_id || null,
            user_id: user_id || null,
            batch_size: batch_size || 10
        });
        console.log('Environment check:', {
            supabase_url: SUPABASE_URL ? 'Set' : 'Missing',
            service_role_key: SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
            telegram_backend_url: TELEGRAM_BACKEND_URL
        });

        if (!campaign_id || !user_id) {
            throw new Error('المعاملات المطلوبة مفقودة: campaign_id, user_id');
        }

        // التحقق من Environment Variables (مثل الوظائف الناجحة)
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            const errorMsg = 'إعدادات Supabase مفقودة - Supabase configuration missing';
            console.error('⚠️', errorMsg);
            throw new Error(errorMsg);
        }

        // التحقق من TELEGRAM_BACKEND_URL (مثل telegram-search-groups)
        if (!TELEGRAM_BACKEND_URL || TELEGRAM_BACKEND_URL === 'http://localhost:8000') {
            const errorMsg = 'TELEGRAM_BACKEND_URL غير مضبوط. يرجى إضافة TELEGRAM_BACKEND_URL في Supabase Environment Variables';
            console.error('⚠️', errorMsg);
            throw new Error(errorMsg);
        }

        // Load campaign
        const campaignResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_campaigns?id=eq.${campaign_id}&user_id=eq.${user_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!campaignResponse.ok) {
            const errorText = await campaignResponse.text();
            console.error(`فشل في جلب بيانات الحملة: ${campaignResponse.status} - ${errorText}`);
            throw new Error(`فشل في جلب بيانات الحملة: ${errorText.substring(0, 200)}`);
        }

        const campaigns = await campaignResponse.json();
        if (!campaigns || campaigns.length === 0) {
            console.error(`الحملة غير موجودة: campaign_id=${campaign_id}, user_id=${user_id}`);
            throw new Error('الحملة غير موجودة أو غير مصرح بها');
        }

        const campaign = campaigns[0];
        
        console.log(`✓ تم العثور على الحملة: ${campaign.id} - ${campaign.name}`);
        console.log('Campaign details:', {
            id: campaign.id,
            status: campaign.status,
            target_type: campaign.target_type,
            total_targets: campaign.total_targets,
            sent_count: campaign.sent_count || 0,
            failed_count: campaign.failed_count || 0
        });

        // Check campaign status
        if (campaign.status !== 'active') {
            throw new Error(`الحملة غير نشطة. الحالة الحالية: ${campaign.status}`);
        }
        
        // Check if campaign has targets
        if (!campaign.total_targets || campaign.total_targets === 0) {
            throw new Error('الحملة لا تحتوي على أهداف محددة');
        }

        // Load sessions
        const sessionIds = Array.isArray(campaign.session_ids) ? campaign.session_ids : [];
        if (sessionIds.length === 0) {
            throw new Error('لا توجد جلسات محددة');
        }

        const sessionsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_sessions?id=in.(${sessionIds.join(',')})&user_id=eq.${user_id}&status=eq.active`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!sessionsResponse.ok) {
            const errorText = await sessionsResponse.text();
            console.error(`فشل في جلب بيانات الجلسات: ${sessionsResponse.status} - ${errorText}`);
            throw new Error(`فشل في جلب بيانات الجلسات: ${errorText.substring(0, 200)}`);
        }

        const sessions = await sessionsResponse.json();
        console.log(`تم العثور على ${sessions.length} جلسة نشطة من ${sessionIds.length} مطلوبة`);
        
        if (sessions.length === 0) {
            throw new Error('لا توجد جلسات نشطة');
        }

        // Get already sent members (if exclude_sent_members is enabled)
        let sentMemberIds: number[] = [];
        if (campaign.exclude_sent_members) {
            const sentResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/telegram_sent_members?user_id=eq.${user_id}&campaign_id=eq.${campaign_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (sentResponse.ok) {
                const sentMembers = await sentResponse.json();
                sentMemberIds = sentMembers.map((m: any) => m.member_telegram_id);
            }
        }

        // Prepare targets based on campaign type
        let targets: any[] = [];
        
        console.log('Preparing targets...', {
            target_type: campaign.target_type,
            selected_groups_type: typeof campaign.selected_groups,
            selected_groups: campaign.selected_groups,
            selected_members_type: typeof campaign.selected_members,
            selected_members: campaign.selected_members
        });
        
        if (campaign.target_type === 'groups' || campaign.target_type === 'both') {
            // معالجة selected_groups من JSONB
            let selectedGroups: any[] = [];
            if (campaign.selected_groups) {
                if (Array.isArray(campaign.selected_groups)) {
                    selectedGroups = campaign.selected_groups;
                } else if (typeof campaign.selected_groups === 'string') {
                    try {
                        selectedGroups = JSON.parse(campaign.selected_groups);
                    } catch (e) {
                        console.error('Error parsing selected_groups:', e);
                        selectedGroups = [];
                    }
                }
            }
            
            console.log('Processed selectedGroups:', selectedGroups);
            
            if (selectedGroups.length > 0) {
                // فصل IDs و usernames
                const groupIds: number[] = [];
                const groupUsernames: string[] = [];
                
                selectedGroups.forEach((item: any) => {
                    if (typeof item === 'number') {
                        groupIds.push(item);
                    } else if (typeof item === 'object' && item.username) {
                        groupUsernames.push(item.username);
                    } else if (typeof item === 'string' && !item.match(/^\d+$/)) {
                        groupUsernames.push(item.replace('@', ''));
                    } else if (typeof item === 'string') {
                        groupIds.push(Number(item));
                    }
                });

                // جلب المجموعات من قاعدة البيانات (IDs فقط)
                if (groupIds.length > 0) {
                    // محاولة group_id أولاً
                    let groupsResponse = await fetch(
                        `${SUPABASE_URL}/rest/v1/telegram_groups?group_id=in.(${groupIds.join(',')})&user_id=eq.${user_id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    let groups: any[] = [];
                    if (groupsResponse.ok) {
                        groups = await groupsResponse.json();
                    }

                    // إذا لم نجدها، جرب telegram_group_id
                    if (groups.length < groupIds.length) {
                        const foundIds = new Set(groups.map((g: any) => g.group_id || g.telegram_group_id || g.id));
                        const missingIds = groupIds.filter(id => !foundIds.has(id));
                        
                        if (missingIds.length > 0) {
                            const groupsResponse2 = await fetch(
                                `${SUPABASE_URL}/rest/v1/telegram_groups?telegram_group_id=in.(${missingIds.join(',')})&user_id=eq.${user_id}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );

                            if (groupsResponse2.ok) {
                                const groups2 = await groupsResponse2.json();
                                groups = [...groups, ...groups2];
                            }
                        }
                    }

                    targets.push(...groups.map((g: any) => ({ 
                        type: 'group', 
                        id: g.group_id || g.telegram_group_id || g.id, 
                        data: g 
                    })));
                }

                // إضافة usernames مباشرة (سيتم حلها في Backend)
                groupUsernames.forEach((username: string) => {
                    targets.push({ 
                        type: 'group', 
                        id: null, 
                        username: username,
                        data: { username: username } 
                    });
                });
            }
        }

        if (campaign.target_type === 'members' || campaign.target_type === 'both') {
            // معالجة selected_members من JSONB
            let selectedMembers: any[] = [];
            if (campaign.selected_members) {
                if (Array.isArray(campaign.selected_members)) {
                    selectedMembers = campaign.selected_members;
                } else if (typeof campaign.selected_members === 'string') {
                    try {
                        selectedMembers = JSON.parse(campaign.selected_members);
                    } catch (e) {
                        console.error('Error parsing selected_members:', e);
                        selectedMembers = [];
                    }
                }
            }
            
            console.log('Processed selectedMembers:', selectedMembers);
            
            if (selectedMembers.length > 0) {
                // فصل IDs و usernames
                const memberIds: number[] = [];
                const memberUsernames: string[] = [];
                
                selectedMembers.forEach((item: any) => {
                    if (typeof item === 'number') {
                        memberIds.push(item);
                    } else if (typeof item === 'object' && item.username) {
                        memberUsernames.push(item.username);
                    } else if (typeof item === 'string' && !item.match(/^\d+$/)) {
                        memberUsernames.push(item.replace('@', ''));
                    } else if (typeof item === 'string') {
                        memberIds.push(Number(item));
                    }
                });

                // جلب الأعضاء من قاعدة البيانات (IDs فقط)
                if (memberIds.length > 0) {
                    const membersResponse = await fetch(
                        `${SUPABASE_URL}/rest/v1/telegram_members?telegram_user_id=in.(${memberIds.join(',')})&user_id=eq.${user_id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (membersResponse.ok) {
                        let members = await membersResponse.json();
                        
                        // Apply filters
                        members = members.filter((m: any) => {
                            if (campaign.exclude_bots && m.is_bot) return false;
                            if (campaign.exclude_premium && m.is_premium) return false;
                            if (campaign.exclude_verified && m.is_verified) return false;
                            if (campaign.exclude_scam && m.is_scam) return false;
                            if (campaign.exclude_fake && m.is_fake) return false;
                            if (sentMemberIds.includes(m.telegram_user_id)) return false;
                            return true;
                        });

                        targets.push(...members.map((m: any) => ({ type: 'member', id: m.telegram_user_id, data: m })));
                    }
                }

                // إضافة usernames مباشرة (سيتم حلها في Backend)
                memberUsernames.forEach((username: string) => {
                    targets.push({ 
                        type: 'member', 
                        id: null, 
                        username: username,
                        data: { username: username } 
                    });
                });
            }
        }

        console.log('Targets prepared:', {
            total: targets.length,
            groups: targets.filter(t => t.type === 'group').length,
            members: targets.filter(t => t.type === 'member').length
        });
        
        if (targets.length === 0) {
            // إذا لم توجد أهداف، قد تكون جميعها تم إرسالها
            console.warn('لا توجد أهداف متاحة للإرسال - قد تكون جميع الأهداف تم إرسالها');
            
            // التحقق من حالة الحملة
            const totalSent = campaign.sent_count || 0;
            if (totalSent >= campaign.total_targets) {
                // تحديث حالة الحملة إلى مكتملة
                await fetch(`${SUPABASE_URL}/rest/v1/telegram_campaigns?id=eq.${campaign_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });
                
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'تم إكمال جميع الأهداف',
                        data: {
                            sent: 0,
                            failed: 0,
                            total_processed: totalSent,
                            total_targets: campaign.total_targets,
                            campaign_status: 'completed'
                        }
                    }),
                    {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                );
            }
            
            throw new Error('لا توجد أهداف متاحة للإرسال. تحقق من إعدادات الفلترة أو أن جميع الأهداف تم إرسالها');
        }

        // Limit batch size
        const limitedTargets = targets.slice(0, batch_size);
        
        // Distribute targets across sessions
        const distributed = distributeTasks(limitedTargets, sessionIds, campaign.distribution_strategy || 'equal');

        const results: any[] = [];
        const errors: any[] = [];

        // Process each session
        for (const session of sessions) {
            const sessionTargets = distributed[session.id] || [];
            if (sessionTargets.length === 0) continue;

            for (const target of sessionTargets) {
                try {
                    let messageText = campaign.message_text;
                    
                    // Personalize message if enabled
                    if (campaign.personalize_messages && target.type === 'member' && target.data) {
                        const firstName = target.data.first_name || '';
                        const username = target.data.username || '';
                        if (firstName) {
                            messageText = messageText.replace('{name}', firstName);
                            messageText = messageText.replace('{username}', username || firstName);
                        }
                    }

                    // Send message based on target type
                    let sendResponse;
                    if (target.type === 'group') {
                        // دعم usernames و IDs
                        const requestBody: any = {
                            session_string: session.session_string,
                            api_id: session.api_id,
                            api_hash: session.api_hash,
                            message: messageText
                        };
                        
                        if (target.id) {
                            requestBody.group_id = target.id;
                        } else if (target.username) {
                            requestBody.username = target.username;
                        } else {
                            throw new Error('لا يوجد group_id أو username للمجموعة');
                        }
                        
                        sendResponse = await fetch(`${TELEGRAM_BACKEND_URL}/messages/send`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestBody)
                        });
                    } else if (target.type === 'member') {
                        // دعم usernames و IDs
                        const requestBody: any = {
                            session_string: session.session_string,
                            api_id: session.api_id,
                            api_hash: session.api_hash,
                            message: messageText,
                            personalize: campaign.personalize_messages
                        };
                        
                        if (target.id) {
                            requestBody.member_telegram_id = target.id;
                        } else if (target.username) {
                            requestBody.username = target.username;
                        } else {
                            throw new Error('لا يوجد member_telegram_id أو username للعضو');
                        }
                        
                        sendResponse = await fetch(`${TELEGRAM_BACKEND_URL}/messages/send-to-member`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestBody)
                        });
                    } else {
                        continue;
                    }

                    if (!sendResponse.ok) {
                        let errorData: any = {};
                        try {
                            errorData = await sendResponse.json();
                        } catch (e) {
                            const errorText = await sendResponse.text();
                            errorData = { message: errorText };
                        }
                        const errorMsg = errorData.detail || errorData.message || `فشل في إرسال الرسالة (${sendResponse.status})`;
                        console.error(`✗ فشل في إرسال الرسالة:`, {
                            target_type: target.type,
                            target_id: target.id || target.username,
                            status: sendResponse.status,
                            error: errorMsg
                        });
                        throw new Error(errorMsg);
                    }

                    const sendResult = await sendResponse.json();

                    if (sendResult.success) {
                        // Save to telegram_campaign_messages
                        const messageRecord: any = {
                            campaign_id: campaign_id,
                            user_id: user_id,
                            session_id: session.id,
                            message_text: messageText,
                            status: 'sent',
                            sent_at: sendResult.sent_at || new Date().toISOString(),
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };

                        if (target.type === 'group') {
                            messageRecord.group_id = target.id || target.username;
                            messageRecord.group_title = target.data?.title || target.username || 'Unknown';
                            if (target.username) {
                                messageRecord.group_username = target.username;
                            }
                        } else {
                            messageRecord.member_id = target.data?.id;
                            messageRecord.member_telegram_id = target.id || target.username;
                            messageRecord.personalized_text = messageText;
                            if (target.username) {
                                messageRecord.member_username = target.username;
                            }
                        }

                        await fetch(`${SUPABASE_URL}/rest/v1/telegram_campaign_messages`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(messageRecord)
                        });

                        // Save to telegram_sent_members if member
                        if (target.type === 'member' && (target.id || target.username)) {
                            await fetch(`${SUPABASE_URL}/rest/v1/telegram_sent_members`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    user_id: user_id,
                                    campaign_id: campaign_id,
                                    member_telegram_id: target.id || target.username,
                                    member_username: target.username || null,
                                    message_text: messageText,
                                    sent_at: new Date().toISOString()
                                })
                            });
                        }

                        results.push({
                            target_type: target.type,
                            target_id: target.id || target.username,
                            target_username: target.username || null,
                            success: true,
                            message_id: sendResult.message_id
                        });
                    } else {
                        throw new Error(sendResult.message || 'فشل في إرسال الرسالة');
                    }

                    // Apply smart delay
                    const delay = smartDelay(
                        campaign.delay_between_messages_min || 30,
                        campaign.delay_between_messages_max || 90,
                        campaign.delay_variation !== false
                    );
                    
                    // Wait (convert to milliseconds)
                    await new Promise(resolve => setTimeout(resolve, delay * 1000));

                } catch (error: any) {
                    // Logging شامل للأخطاء في كل رسالة
                    const errorLog = {
                        timestamp: new Date().toISOString(),
                        target_type: target.type,
                        target_id: target.id || target.username,
                        target_username: target.username || null,
                        session_id: session.id,
                        session_name: session.session_name,
                        error_name: error?.name || 'Unknown',
                        error_message: error?.message || 'خطأ غير معروف',
                        error_stack: error?.stack || 'No stack trace',
                        request_body: target.type === 'group' ? {
                            group_id: target.id,
                            username: target.username,
                            message_length: messageText.length
                        } : {
                            member_telegram_id: target.id,
                            username: target.username,
                            message_length: messageText.length
                        }
                    };

                    console.error('========== خطأ في إرسال رسالة ==========');
                    console.error(JSON.stringify(errorLog, null, 2));
                    console.error('========================================');

                    errors.push({
                        target_type: target.type,
                        target_id: target.id || target.username,
                        target_username: target.username || null,
                        error: error.message || 'خطأ غير معروف',
                        error_details: errorLog
                    });

                    // Save failed message
                    const messageRecord: any = {
                        campaign_id: campaign_id,
                        user_id: user_id,
                        session_id: session.id,
                        message_text: campaign.message_text,
                        status: 'failed',
                        error_message: error.message || 'خطأ غير معروف',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    if (target.type === 'group') {
                        messageRecord.group_id = target.id || target.username;
                        messageRecord.group_title = target.data?.title || target.username || 'Unknown';
                        if (target.username) {
                            messageRecord.group_username = target.username;
                        }
                    } else {
                        messageRecord.member_telegram_id = target.id || target.username;
                        if (target.username) {
                            messageRecord.member_username = target.username;
                        }
                    }

                    await fetch(`${SUPABASE_URL}/rest/v1/telegram_campaign_messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(messageRecord)
                    });
                }
            }
        }

        // Update campaign statistics
        const sentCount = results.length;
        const failedCount = errors.length;
        const currentSent = campaign.sent_count || 0;
        const currentFailed = campaign.failed_count || 0;

        await fetch(`${SUPABASE_URL}/rest/v1/telegram_campaigns?id=eq.${campaign_id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sent_count: currentSent + sentCount,
                failed_count: currentFailed + failedCount,
                updated_at: new Date().toISOString()
            })
        });

        // Check if campaign is completed
        const totalSent = currentSent + sentCount;
        const totalFailed = currentFailed + failedCount;
        const totalProcessed = totalSent + totalFailed;
        
        let newStatus = campaign.status;
        if (totalProcessed >= campaign.total_targets) {
            newStatus = 'completed';
            const completeResponse = await fetch(`${SUPABASE_URL}/rest/v1/telegram_campaigns?id=eq.${campaign_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            if (!completeResponse.ok) {
                const errorText = await completeResponse.text();
                console.warn(`⚠️ فشل في تحديث حالة الحملة إلى completed: ${errorText.substring(0, 200)}`);
            } else {
                console.log(`✓ تم تحديث حالة الحملة إلى completed`);
            }
        }

        console.log(`✓ تم إرسال ${sentCount} رسالة بنجاح، ${failedCount} فشل`);
        console.log('===============================================');

        // Return success response (مثل telegram-import-groups)
        return new Response(
            JSON.stringify({
                success: true,
                message: `تم إرسال ${sentCount} رسالة بنجاح`,
                data: {
                    sent: sentCount,
                    failed: failedCount,
                    total_processed: totalProcessed,
                    total_targets: campaign.total_targets,
                    campaign_status: newStatus,
                    timestamp: new Date().toISOString()
                },
                results: results,
                errors: errors
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        // معالجة الأخطاء مثل telegram-import-groups
        console.error('========== خطأ في إرسال دفعة الرسائل ==========');
        console.error('Timestamp:', new Date().toISOString());
        
        // Extract error message safely (مثل telegram-import-groups)
        let errorMessage = 'حدث خطأ غير معروف';
        let errorDetails: any = null;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
                name: error.name,
                stack: error.stack,
                cause: error.cause
            };
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            errorMessage = (error as any).message || JSON.stringify(error);
            errorDetails = error;
        }
        
        console.error('Error message:', errorMessage);
        console.error('Error details:', {
            message: errorMessage,
            details: errorDetails,
            request_data: requestData ? {
                campaign_id: requestData.campaign_id || null,
                user_id: requestData.user_id || null,
                batch_size: requestData.batch_size || null
            } : null,
            environment: {
                supabase_url: SUPABASE_URL ? 'Set' : 'Missing',
                telegram_backend_url: TELEGRAM_BACKEND_URL || 'Not set'
            }
        });
        console.error('===============================================');

        // Return error response (مثل telegram-import-groups و telegram-search-groups)
        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'CAMPAIGN_SEND_BATCH_FAILED',
                    message: `خطأ في إرسال دفعة الرسائل: ${errorMessage}`,
                    details: errorDetails,
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

