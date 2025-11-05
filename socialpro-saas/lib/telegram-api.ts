// lib/telegram-api.ts
// مكتبة للتواصل مع Telegram Backend API

const BACKEND_URL = process.env.NEXT_PUBLIC_TELEGRAM_BACKEND_URL || 'http://localhost:8000';

export interface SendCodeResponse {
  success: boolean;
  phone_code_hash: string;
  message: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  session_string: string;
  message: string;
}

export interface TelegramGroup {
  group_id: number;
  title: string;
  username: string | null;
  members_count: number;
  type: 'group' | 'supergroup' | 'channel';
}

export interface ImportGroupsResponse {
  success: boolean;
  groups: TelegramGroup[];
  total: number;
}

/**
 * إرسال رمز التحقق إلى رقم الهاتف
 */
export async function sendVerificationCode(
  phone: string,
  apiId: string,
  apiHash: string
): Promise<SendCodeResponse> {
  const response = await fetch(`${BACKEND_URL}/auth/send-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      api_id: apiId,
      api_hash: apiHash,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'فشل إرسال رمز التحقق');
  }

  return response.json();
}

/**
 * التحقق من رمز التحقق والحصول على session_string
 */
export async function verifyCode(
  phone: string,
  apiId: string,
  apiHash: string,
  code: string,
  password?: string
): Promise<VerifyCodeResponse> {
  const response = await fetch(`${BACKEND_URL}/auth/verify-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      api_id: apiId,
      api_hash: apiHash,
      code,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'رمز التحقق غير صحيح');
  }

  return response.json();
}

/**
 * استيراد المجموعات من حساب تيليجرام
 */
export async function importGroups(
  sessionId: string,
  apiId: string,
  apiHash: string,
  sessionString: string
): Promise<ImportGroupsResponse> {
  const url = new URL(`${BACKEND_URL}/groups/import/${sessionId}`);
  url.searchParams.append('api_id', apiId);
  url.searchParams.append('api_hash', apiHash);
  url.searchParams.append('session_string', sessionString);

  const response = await fetch(url.toString(), {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'فشل استيراد المجموعات');
  }

  return response.json();
}

/**
 * حذف جلسة من Backend
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'فشل حذف الجلسة');
  }
}

/**
 * فحص صحة Backend API
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
