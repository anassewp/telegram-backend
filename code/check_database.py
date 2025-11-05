#!/usr/bin/env python3
"""
سكريبت للتحقق من قاعدة بيانات SocialPro
يتحقق من الجداول والبيانات الموجودة
"""

import requests
import json
from urllib.parse import urljoin

# إعدادات Supabase من .env.local
SUPABASE_URL = "https://gigrtzamstdyynmvwljq.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc"

# الجداول المتوقعة في المشروع
EXPECTED_TABLES = [
    "profiles", "subscription_plans", "user_subscriptions", "campaigns", 
    "social_platforms", "campaign_platforms", "posts", "messages", 
    "analytics", "settings", "notifications", "files", "user_goals", "admin_logs"
]

def make_supabase_request(endpoint, method="GET", data=None):
    """إجراء طلب إلى Supabase REST API"""
    url = urljoin(SUPABASE_URL, f"/rest/v1/{endpoint}")
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        return response.status_code, response.json() if response.text else None
        
    except Exception as e:
        return 500, {"error": str(e)}

def check_table_exists(table_name):
    """التحقق من وجود جدول"""
    try:
        status, data = make_supabase_request(f"{table_name}?select=count", "GET")
        return status == 200, data
    except:
        return False, None

def get_table_data(table_name, limit=5):
    """جلب بيانات عينة من الجدول"""
    try:
        status, data = make_supabase_request(f"{table_name}?select=*&limit={limit}", "GET")
        return status == 200, data
    except:
        return False, None

def analyze_database():
    """تحليل شامل لقاعدة البيانات"""
    print("🔍 بدء التحقق من قاعدة بيانات SocialPro...")
    print(f"📍 URL: {SUPABASE_URL}")
    print("-" * 80)
    
    results = {
        "connection_status": "unknown",
        "tables": {},
        "total_tables": 0,
        "working_tables": 0,
        "total_records": 0
    }
    
    # التحقق من الاتصال بـ Supabase
    print("\n🔗 اختبار الاتصال...")
    try:
        status, data = make_supabase_request("profiles?select=count", "GET")
        results["connection_status"] = "✅ ناجح" if status == 200 else f"❌ فشل (Code: {status})"
        print(f"   Status: {results['connection_status']}")
        if data and 'error' in data:
            print(f"   Error: {data['error']}")
    except Exception as e:
        results["connection_status"] = f"❌ خطأ في الاتصال: {str(e)}"
        print(f"   Status: {results['connection_status']}")
    
    # فحص الجداول
    print(f"\n📋 فحص الجداول ({len(EXPECTED_TABLES)} جدول متوقع)...")
    print("-" * 80)
    
    for table in EXPECTED_TABLES:
        print(f"\n📊 فحص جدول: {table}")
        
        # فحص وجود الجدول
        exists, _ = check_table_exists(table)
        results["total_tables"] += 1
        
        if exists:
            results["working_tables"] += 1
            print(f"   ✅ موجود ومتاح")
            
            # جلب عينة من البيانات
            success, data = get_table_data(table, 3)
            if success and data:
                record_count = len(data)
                results["total_records"] += record_count
                
                print(f"   📝 عدد السجلات (عينة): {record_count}")
                print(f"   🔍 هيكل البيانات (أول صف):")
                
                if data and len(data) > 0:
                    first_record = data[0]
                    for key, value in first_record.items():
                        value_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                        print(f"      • {key}: {value_str}")
                
                results["tables"][table] = {
                    "status": "✅ متاح",
                    "sample_count": record_count,
                    "structure": list(first_record.keys()) if data else [],
                    "sample_data": data[:2] if data else []
                }
            else:
                print(f"   ⚠️  متاح لكن لا توجد بيانات")
                results["tables"][table] = {
                    "status": "⚠️  متاح فارغ",
                    "sample_count": 0,
                    "structure": [],
                    "sample_data": []
                }
        else:
            print(f"   ❌ غير موجود أو غير متاح")
            results["tables"][table] = {
                "status": "❌ غير متاح",
                "sample_count": 0,
                "structure": [],
                "sample_data": []
            }
    
    # تقرير نهائي
    print("\n" + "=" * 80)
    print("📋 التقرير النهائي")
    print("=" * 80)
    print(f"🔗 حالة الاتصال: {results['connection_status']}")
    print(f"📊 إجمالي الجداول: {results['total_tables']}")
    print(f"✅ الجداول المتاحة: {results['working_tables']}")
    print(f"📝 إجمالي السجلات (عينة): {results['total_records']}")
    
    success_rate = (results["working_tables"] / results["total_tables"]) * 100 if results["total_tables"] > 0 else 0
    print(f"🎯 معدل النجاح: {success_rate:.1f}%")
    
    # حفظ النتائج
    with open("/workspace/code/database_check_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 تم حفظ التقرير في: /workspace/code/database_check_results.json")
    
    return results

if __name__ == "__main__":
    analyze_database()
