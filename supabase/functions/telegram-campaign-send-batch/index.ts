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

    try {
        const requestData = await req.json();
        const { campaign_id, user_id, batch_size = 10 } = requestData;

        if (!campaign_id || !user_id) {
            throw new Error('المعاملات المطلوبة مفقودة: campaign_id, user_id');
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('إعدادات Supabase مفقودة');
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
            throw new Error('فشل في جلب بيانات الحملة');
        }

        const campaigns = await campaignResponse.json();
        if (!campaigns || campaigns.length === 0) {
            throw new Error('الحملة غير موجودة أو غير مصرح بها');
        }

        const campaign = campaigns[0];

        // Check campaign status
        if (campaign.status !== 'active') {
            throw new Error(`الحملة غير نشطة. الحالة الحالية: ${campaign.status}`);
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
            throw new Error('فشل في جلب بيانات الجلسات');
        }

        const sessions = await sessionsResponse.json();
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
        
        if (campaign.target_type === 'groups' || campaign.target_type === 'both') {
            const selectedGroups = Array.isArray(campaign.selected_groups) ? campaign.selected_groups : [];
            if (selectedGroups.length > 0) {
                const groupsResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/telegram_groups?telegram_group_id=in.(${selectedGroups.join(',')})&user_id=eq.${user_id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (groupsResponse.ok) {
                    const groups = await groupsResponse.json();
                    targets.push(...groups.map((g: any) => ({ type: 'group', id: g.telegram_group_id, data: g })));
                }
            }
        }

        if (campaign.target_type === 'members' || campaign.target_type === 'both') {
            const selectedMembers = Array.isArray(campaign.selected_members) ? campaign.selected_members : [];
            if (selectedMembers.length > 0) {
                // Filter members based on campaign settings
                const membersResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/telegram_members?telegram_user_id=in.(${selectedMembers.join(',')})&user_id=eq.${user_id}`,
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
        }

        if (targets.length === 0) {
            throw new Error('لا توجد أهداف متاحة للإرسال');
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
                        sendResponse = await fetch(`${TELEGRAM_BACKEND_URL}/messages/send`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                session_string: session.session_string,
                                api_id: session.api_id,
                                api_hash: session.api_hash,
                                group_id: target.id,
                                message: messageText
                            })
                        });
                    } else if (target.type === 'member') {
                        sendResponse = await fetch(`${TELEGRAM_BACKEND_URL}/messages/send-to-member`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                session_string: session.session_string,
                                api_id: session.api_id,
                                api_hash: session.api_hash,
                                member_telegram_id: target.id,
                                message: messageText,
                                personalize: campaign.personalize_messages
                            })
                        });
                    } else {
                        continue;
                    }

                    if (!sendResponse.ok) {
                        const errorData = await sendResponse.json();
                        throw new Error(errorData.detail || errorData.message || 'فشل في إرسال الرسالة');
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
                            messageRecord.group_id = target.id;
                            messageRecord.group_title = target.data.title;
                        } else {
                            messageRecord.member_id = target.data.id;
                            messageRecord.member_telegram_id = target.id;
                            messageRecord.personalized_text = messageText;
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
                        if (target.type === 'member') {
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
                                    member_telegram_id: target.id,
                                    message_text: messageText,
                                    sent_at: new Date().toISOString()
                                })
                            });
                        }

                        results.push({
                            target_type: target.type,
                            target_id: target.id,
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
                    errors.push({
                        target_type: target.type,
                        target_id: target.id,
                        error: error.message || 'خطأ غير معروف'
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
                        messageRecord.group_id = target.id;
                    } else {
                        messageRecord.member_telegram_id = target.id;
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
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `تم إرسال ${sentCount} رسالة بنجاح`,
                data: {
                    sent: sentCount,
                    failed: failedCount,
                    total_processed: totalProcessed,
                    total_targets: campaign.total_targets,
                    campaign_status: newStatus
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
        console.error('خطأ في إرسال دفعة الرسائل:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'CAMPAIGN_SEND_BATCH_FAILED',
                    message: error.message || 'خطأ في إرسال دفعة الرسائل',
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

