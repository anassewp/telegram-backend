#!/usr/bin/env python3
"""
فحص سريع لقاعدة بيانات SocialPro
يمكن استخدامه للتحقق السريع من حالة قاعدة البيانات
"""

import requests
import json
from urllib.parse import urljoin

SUPABASE_URL = "https://gigrtzamstdyynmvwljq.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc"

TABLES = [
    "profiles", "subscription_plans", "subscriptions", "platforms", 
    "user_platforms", "features", "plan_features", "campaigns", 
    "points_transactions", "invoices", "notifications", "activities", 
    "api_keys", "reports"
]

def quick_check():
    """فحص سريع لقاعدة البيانات"""
    print("🔍 فحص سريع لقاعدة بيانات SocialPro")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }
    
    working_tables = 0
    
    for table in TABLES:
        try:
            url = f"{SUPABASE_URL}/rest/v1/{table}?select=count"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                working_tables += 1
                print(f"✅ {table}")
            else:
                print(f"❌ {table} (Status: {response.status_code})")
                
        except Exception as e:
            print(f"❌ {table} (Error: {str(e)[:50]})")
    
    print("=" * 50)
    print(f"📊 النتيجة: {working_tables}/{len(TABLES)} جدول متاح")
    
    if working_tables == len(TABLES):
        print("🎉 ممتاز! قاعدة البيانات في حالة جيدة")
    elif working_tables >= len(TABLES) * 0.8:
        print("⚠️ جيدة جداً! معظم الجداول متاحة")
    else:
        print("🔴 تحتاج إلى فحص - مشاكل في قاعدة البيانات")

if __name__ == "__main__":
    quick_check()
