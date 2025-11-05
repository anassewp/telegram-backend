#!/usr/bin/env python3
"""
فحص متقدم لنظام التخزين في SocialPro
"""

import requests
import json

SUPABASE_URL = "https://gigrtzamstdyynmvwljq.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc"

def test_storage_comprehensive():
    """فحص شامل لنظام التخزين"""
    print("🗄️ فحص شامل لنظام التخزين")
    print("=" * 70)
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    # 1. فحص قائمة buckets
    print("\n📋 1. فحص قائمة buckets...")
    try:
        url = f"{SUPABASE_URL}/storage/v1/bucket"
        response = requests.get(url, headers=headers)
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            buckets = response.json()
            print(f"   ✅ تم العثور على {len(buckets)} bucket:")
            for bucket in buckets:
                print(f"      • {bucket.get('name', 'N/A')} - {bucket.get('public', False)}")
        else:
            print(f"   ❌ فشل في جلب قائمة buckets")
            print(f"   Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ خطأ: {str(e)}")
    
    # 2. فحص buckets محددة
    test_buckets = ["avatars", "campaign-files", "reports"]
    
    print(f"\n🔍 2. فحص buckets محددة ({len(test_buckets)})...")
    
    for bucket_name in test_buckets:
        print(f"\n   📦 {bucket_name}:")
        
        try:
            # محاولة الوصول للـ bucket
            url = f"{SUPABASE_URL}/storage/v1/bucket/{bucket_name}"
            response = requests.get(url, headers=headers)
            
            print(f"      Bucket Info - Status: {response.status_code}")
            if response.status_code == 200:
                bucket_info = response.json()
                print(f"      ✅ Bucket موجود: {bucket_info.get('name')}")
                print(f"      🔒 عام: {bucket_info.get('public', False)}")
                print(f"      📊 الحد الأقصى: {bucket_info.get('file_size_limit')}")
                print(f"      🗂️ MIME types: {bucket_info.get('allowed_mime_types')}")
            else:
                print(f"      ❌ Bucket غير موجود أو غير متاح")
                print(f"      Response: {response.text[:100]}")
            
            # محاولة جلب قائمة الملفات
            url = f"{SUPABASE_URL}/storage/v1/object/list/{bucket_name}"
            response = requests.post(url, headers=headers, json={"limit": 5})
            
            print(f"      Files List - Status: {response.status_code}")
            if response.status_code == 200:
                files = response.json()
                print(f"      📁 عدد الملفات: {len(files)}")
            elif response.status_code == 400:
                print(f"      ⚠️ Bucket فارغ أو يحتاج صلاحيات")
            else:
                print(f"      ❌ مشكلة في الوصول للملفات")
                
        except Exception as e:
            print(f"      ❌ خطأ: {str(e)}")
    
    # 3. اختبار إنشاء bucket جديد (للاختبار فقط)
    print(f"\n🧪 3. اختبار إنشاء bucket...")
    try:
        test_bucket_name = "test-bucket-" + str(int(__import__('time').time()))
        url = f"{SUPABASE_URL}/storage/v1/bucket"
        data = {
            "id": test_bucket_name,
            "name": test_bucket_name,
            "public": False,
            "file_size_limit": 5242880,
            "allowed_mime_types": ["image/*"]
        }
        response = requests.post(url, headers=headers, json=data)
        
        print(f"      Status: {response.status_code}")
        if response.status_code == 200:
            print(f"      ✅ تم إنشاء bucket اختبار بنجاح")
            
            # حذف bucket الاختبار
            delete_url = f"{SUPABASE_URL}/storage/v1/bucket/{test_bucket_name}"
            delete_response = requests.delete(delete_url, headers=headers)
            print(f"      🗑️ تم حذف bucket الاختبار - Status: {delete_response.status_code}")
        else:
            print(f"      ❌ فشل في إنشاء bucket")
            print(f"      Response: {response.text[:100]}")
            
    except Exception as e:
        print(f"      ❌ خطأ: {str(e)}")

if __name__ == "__main__":
    test_storage_comprehensive()
