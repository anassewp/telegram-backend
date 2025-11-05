import { createClient } from '@supabase/supabase-js';

// المشروع الرئيسي: gigrtzamstdyynmvwljq
// Project URL: https://gigrtzamstdyynmvwljq.supabase.co
// Dashboard: https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gigrtzamstdyynmvwljq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
