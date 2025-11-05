#!/usr/bin/env python3
"""
فحص نظام التخزين (Storage Buckets) في SocialPro
"""

import requests
import json

SUPABASE_URL = "https://gigrtzamstdyynmvwljq.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc"

EXPECTED_BUCKETS = ["avatars", "campaign-files", "reports"]

def check_storage_buckets():
    """فحص buckets التخزين"""
    print("🗄️ فحص نظام التخزين (Storage Buckets)")
    print("=" * 60)
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    working_buckets = 0
    
    for bucket in EXPECTED_BUCKETS:
        print(f"\n📦 فحص bucket: {bucket}")
        
        try:
            # محاولة جلب قائمة الملفات من الـ bucket
            url = f"{SUPABASE_URL}/storage/v1/object/list/{bucket}"
            response = requests.post(url, headers=headers, json={"limit": 1})
            
            if response.status_code == 200:
                working_buckets += 1
                print(f"   ✅ متاح ويعمل")
                
                # عرض معلومات الـ bucket
                bucket_info = response.json()
                if bucket_info:
                    print(f"   📁 عدد الملفات: {len(bucket_info)}")
                else:
                    print(f"   📁 فارغ (لا توجد ملفات)")
                    
            elif response.status_code == 401:
                print(f"   ⚠️ مشكلة في الصلاحيات")
            else:
                print(f"   ❌ غير متاح (Status: {response.status_code})")
                
        except Exception as e:
            print(f"   ❌ خطأ: {str(e)[:50]}")
    
    print("\n" + "=" * 60)
    print(f"📊 النتيجة: {working_buckets}/{len(EXPECTED_BUCKETS)} bucket متاح")
    
    if working_buckets == len(EXPECTED_BUCKETS):
        print("🎉 ممتاز! جميع buckets التخزين تعمل")
    elif working_buckets >= 1:
        print("⚠️ معظم buckets تعمل - جزئياً متاح")
    else:
        print("🔴 مشاكل في نظام التخزين")

if __name__ == "__main__":
    check_storage_buckets()
