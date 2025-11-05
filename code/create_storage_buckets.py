#!/usr/bin/env python3
"""
سكريبت لإنشاء Storage Buckets في SocialPro
يمكن استخدامه لإنشاء buckets التخزين المفقودة
"""

import requests
import json

SUPABASE_URL = "https://gigrtzamstdyynmvwljq.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc"

# تعريف buckets المطلوب إنشاؤها
BUCKETS_TO_CREATE = [
    {
        "name": "avatars",
        "description": "صور المستخدمين الشخصية",
        "public": False,
        "file_size_limit": 5_242_880,  # 5 MB
        "allowed_mime_types": ["image/*"]
    },
    {
        "name": "campaign-files", 
        "description": "ملفات الحملات التسويقية",
        "public": False,
        "file_size_limit": 52_428_800,  # 50 MB
        "allowed_mime_types": ["image/*", "video/*", "application/pdf"]
    },
    {
        "name": "reports",
        "description": "التقارير المُصدرة",
        "public": False, 
        "file_size_limit": 10_485_760,  # 10 MB
        "allowed_mime_types": ["application/pdf", "text/*", "application/json"]
    }
]

def create_storage_bucket(bucket_config):
    """إنشاء bucket واحد"""
    name = bucket_config["name"]
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"\n📦 إنشاء bucket: {name}")
    print(f"   الوصف: {bucket_config['description']}")
    
    try:
        url = f"{SUPABASE_URL}/storage/v1/bucket"
        data = {
            "id": name,
            "name": name,
            "public": bucket_config["public"],
            "file_size_limit": bucket_config["file_size_limit"],
            "allowed_mime_types": bucket_config["allowed_mime_types"]
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 201:
            print(f"   ✅ تم إنشاؤه بنجاح!")
            bucket_info = response.json()
            print(f"   📊 ID: {bucket_info.get('id')}")
            return True
        elif response.status_code == 409:
            print(f"   ⚠️ موجود مسبقاً")
            return True
        else:
            print(f"   ❌ فشل في الإنشاء")
            print(f"   Error: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   ❌ خطأ: {str(e)}")
        return False

def create_all_buckets():
    """إنشاء جميع buckets المطلوبة"""
    print("🗄️ إنشاء Storage Buckets لـ SocialPro")
    print("=" * 60)
    
    successful = 0
    total = len(BUCKETS_TO_CREATE)
    
    for bucket_config in BUCKETS_TO_CREATE:
        if create_storage_bucket(bucket_config):
            successful += 1
    
    print("\n" + "=" * 60)
    print(f"📊 النتيجة: {successful}/{total} bucket تم إنشاؤه")
    
    if successful == total:
        print("🎉 ممتاز! تم إنشاء جميع buckets بنجاح")
    elif successful > 0:
        print("⚠️ تم إنشاء بعض buckets - تحقق من المتبقي")
    else:
        print("🔴 فشل في إنشاء أي bucket - تحقق من صلاحيات API")
    
    print("\n📝 ملاحظة: في حالة فشل الإنشاء، يمكن إنشاء buckets يدوياً من:")
    print("   https://dashboard.supabase.com/project/gigrtzamstdyynmvwljq/storage")

if __name__ == "__main__":
    create_all_buckets()
