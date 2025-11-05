# 📋 كود Edge Functions المحدث - جاهز للنسخ

**تاريخ:** 2025-11-03

---

## ✅ Edge Function 1: create-admin-user

### الكود المحدث (انسخه كاملاً):

```typescript
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-request-id, x-user-agent, x-forwarded-for',
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
    // Get parameters from request body
    const requestBody = await req.json();
    const { email, password, role = 'authenticated' } = requestBody;

    if (!email || !password) {
      return new Response(JSON.stringify({
        error: { code: 'MISSING_PARAMS', message: 'Email and password are required' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get environment variables - محدث لاستخدام SERVICE_ROLE_KEY
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      return new Response(JSON.stringify({
        error: { code: 'CONFIG_ERROR', message: 'Missing Supabase configuration' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Generate user ID
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create user record (directly insert into auth.users table)
    const insertUserQuery = `
        INSERT INTO auth.users (
          id, email, encrypted_password, email_confirmed_at,
          created_at, updated_at, role, aud,
          confirmation_token, email_confirm_token_sent_at
        ) VALUES (
          $1, $2, crypt($3, gen_salt('bf')), $4,
          $5, $6, $7, 'authenticated',
          '', $8
        ) RETURNING id, email, created_at
      `;

    // Use fetch to call Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        query: insertUserQuery,
        params: [userId, email, password, now, now, now, role, now]
      })
    });

    if (!response.ok) {
      // If direct insert fails, try using Admin API to create user
      const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: { role: role }
        })
      });

      if (!adminResponse.ok) {
        const errorText = await adminResponse.text();
        return new Response(JSON.stringify({
          error: {
            code: 'USER_CREATION_FAILED',
            message: `Failed to create user: ${errorText}`,
            details: { status: adminResponse.status }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      const userData = await adminResponse.json();
      return new Response(JSON.stringify({
        success: true,
        message: 'Admin user created successfully via Admin API',
        user: {
          id: userData.id,
          email: userData.email,
          created_at: userData.created_at,
          method: 'admin_api'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userData = await response.json();
    return new Response(JSON.stringify({
      success: true,
      message: 'Admin user created successfully via direct SQL',
      user: {
        id: userId,
        email: email,
        created_at: now,
        method: 'direct_sql'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: { code: 'FUNCTION_ERROR', message: error.message }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

---

## ✅ Edge Function 2: telegram-import-groups-from-session

### الكود المحدث (انسخه كاملاً):

```typescript
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
      throw new Error('إعدادات Supabase مفقودة');
    }

    console.log(`استيراد مجموعات من الجلسة: ${session_id} للمستخدم: ${user_id}`);

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
    const url = new URL(`${TELEGRAM_BACKEND_URL}/groups/import/${session_id}`);
    url.searchParams.append('api_id', api_id);
    url.searchParams.append('api_hash', api_hash);
    url.searchParams.append('session_string', session_string);

    const backendResponse = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('خطأ من Telegram Backend:', errorText);
      throw new Error(`فشل في استيراد المجموعات من Backend: ${errorText}`);
    }

    const backendData = await backendResponse.json();

    if (!backendData.success || !backendData.groups || !Array.isArray(backendData.groups)) {
      throw new Error('لم يتم إرجاع مجموعات صالحة من Backend');
    }

    console.log(`تم جلب ${backendData.groups.length} مجموعة من Backend`);

    // حفظ المجموعات في قاعدة البيانات
    const groupRecords = backendData.groups.map((group: any) => ({
      user_id: user_id,
      session_id: session_id,
      group_id: group.group_id,
      title: group.title || '',
      username: group.username || null,
      members_count: group.members_count || 0,
      type: group.type || 'group',
      is_active: true
    }));

    // إدراج المجموعات في قاعدة البيانات
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

    // Return success response
    const response = {
      success: true,
      groups: insertedGroups,
      total: insertedGroups.length,
      message: `تم استيراد ${insertedGroups.length} مجموعة بنجاح`
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
```

---

## 📝 ملاحظات مهمة:

### التغيير الرئيسي:

**في Edge Function 1 (create-admin-user):**
- ✅ تم تغيير: `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`
- ✅ إلى: `Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`

**في Edge Function 2 (telegram-import-groups-from-session):**
- ✅ الكود محدث بالفعل ويستخدم `SERVICE_ROLE_KEY`

---

## 🎯 الخطوات:

1. **افتح Supabase Dashboard**
2. **Edge Functions** → **Edit** على `create-admin-user`
3. **انسخ الكود الأول** (create-admin-user) والصقه
4. **Deploy**

5. **Edge Functions** → **Edit** على `telegram-import-groups-from-session` (أو إنشاؤه جديد إذا لم يكن موجوداً)
6. **انسخ الكود الثاني** (telegram-import-groups-from-session) والصقه
7. **Deploy**

---

**تم!** 🎉

