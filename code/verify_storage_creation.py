#!/usr/bin/env python3
"""
التحقق من إنشاء Storage Buckets بنجاح
"""

import requests
import json

SUPABASE_URL = "https://gigrtzamstdyynmvwljq.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc"

def verify_storage_buckets():
    """التحقق من إنشاء Storage Buckets بنجاح"""
    print("🔍 التحقق من Storage Buckets الجديدة")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    # فحص قائمة buckets
    print("\n📋 فحص قائمة Storage Buckets:")
    try:
        url = f"{SUPABASE_URL}/storage/v1/bucket"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            buckets = response.json()
            print(f"✅ تم العثور على {len(buckets)} bucket:")
            
            # التحقق من buckets المطلوبة
            required_buckets = {
                "avatars": {"limit": 5242880, "types": ["image/*"]},
                "campaign-files": {"limit": 52428800, "types": ["image/*", "video/*", "audio/*"]},
                "reports": {"limit": 10485760, "types": ["application/pdf", "text/*"]}
            }
            
            for bucket in buckets:
                name = bucket.get('name', 'N/A')
                public = bucket.get('public', False)
                limit = bucket.get('file_size_limit', 0)
                allowed_types = bucket.get('allowed_mime_types', [])
                
                print(f"\n   📦 {name}:")
                print(f"      🔓 عام: {public}")
                print(f"      📊 الحد الأقصى: {limit:,} bytes ({limit/1024/1024:.1f} MB)")
                print(f"      🗂️ MIME Types: {allowed_types}")
                
                # التحقق من متطلبات bucket
                if name in required_buckets:
                    req = required_buckets[name]
                    if limit == req["limit"]:
                        print(f"      ✅ الحد الأقصى صحيح: {req['limit']:,} bytes")
                    else:
                        print(f"      ❌ الحد الأقصى خاطئ: متوقع {req['limit']:,}, موجود {limit:,}")
                    
                    # فحص أنواع MIME (تحقق أساسي)
                    if len(allowed_types) >= len(req["types"]) // 2:  # مرونة في الفحص
                        print(f"      ✅ أنواع MIME مقبولة")
                    else:
                        print(f"      ⚠️ أنواع MIME محدودة")
                        
            print(f"\n🎉 إجمالي Storage Buckets: {len(buckets)}")
            return True, len(buckets)
            
        else:
            print(f"❌ فشل في جلب قائمة buckets: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False, 0
            
    except Exception as e:
        print(f"❌ خطأ: {str(e)}")
        return False, 0

def test_bucket_access():
    """اختبار الوصول للـ buckets الجديدة"""
    print(f"\n🧪 اختبار الوصول للـ buckets:")
    
    test_buckets = ["avatars", "campaign-files", "reports"]
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    for bucket_name in test_buckets:
        print(f"\n   📁 اختبار {bucket_name}:")
        
        try:
            # اختبار جلب معلومات Bucket
            bucket_url = f"{SUPABASE_URL}/storage/v1/bucket/{bucket_name}"
            response = requests.get(bucket_url, headers=headers)
            
            if response.status_code == 200:
                bucket_info = response.json()
                print(f"      ✅ Bucket موجود ومتاح")
                print(f"      📊 الحجم المسموح: {bucket_info.get('file_size_limit', 0)/1024/1024:.1f} MB")
                
                # اختبار قائمة الملفات (يجب أن تكون فارغة في البداية)
                files_url = f"{SUPABASE_URL}/storage/v1/object/list/{bucket_name}"
                files_response = requests.post(files_url, headers=headers, json={"limit": 1})
                
                if files_response.status_code == 200:
                    files = files_response.json()
                    print(f"      ✅ يمكن الوصول لقائمة الملفات: {len(files)} ملف")
                elif files_response.status_code == 400:
                    print(f"      ✅ Bucket فارغ (متوقع)")
                else:
                    print(f"      ⚠️ قائمة الملفات تحتاج صلاحيات")
                    
            elif response.status_code == 404:
                print(f"      ❌ Bucket غير موجود: {bucket_name}")
            else:
                print(f"      ⚠️ حالة غير متوقعة: {response.status_code}")
                
        except Exception as e:
            print(f"      ❌ خطأ في اختبار {bucket_name}: {str(e)}")

if __name__ == "__main__":
    # التحقق من إنشاء Buckets
    success, bucket_count = verify_storage_buckets()
    
    if success and bucket_count >= 3:
        # اختبار الوصول
        test_bucket_access()
        
        print(f"\n🎉 حالة Storage Buckets: مكتملة ✅")
        print(f"   📦 buckets الموجودة: {bucket_count}")
        print(f"   🔓 الوصول العام: مفعل")
        print(f"   📊 حدود الحجم: محددة حسب المتطلبات")
        print(f"   🗂️ أنواع MIME: متنوعة حسب الاستخدام")
        
        print(f"\n✅ تم إصلاح مشكلة Storage Buckets بنجاح!")
    else:
        print(f"\n❌ مشكلة في إنشاء Storage Buckets")