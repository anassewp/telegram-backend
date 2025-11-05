#!/usr/bin/env python3
"""
سكريبت محدث للتحقق من قاعدة بيانات SocialPro
باستخدام أسماء الجداول الصحيحة من تقرير التسليم
"""

import requests
import json
from urllib.parse import urljoin

# إعدادات Supabase من .env.local
SUPABASE_URL = "https://gigrtzamstdyynmvwljq.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc"

# الجداول الصحيحة من تقرير التسليم (14 جدول)
CORRECT_TABLES = [
    "profiles", "subscription_plans", "subscriptions", "platforms", 
    "user_platforms", "features", "plan_features", "campaigns", 
    "points_transactions", "invoices", "notifications", "activities", 
    "api_keys", "reports"
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

def get_table_structure(table_name):
    """جلب هيكل الجدول (الأعمدة)"""
    try:
        # استخدام endpoint خاص للحصول على schema
        status, data = make_supabase_request(f"{table_name}?select=*&limit=0", "GET")
        return status == 200, data
    except:
        return False, None

def analyze_correct_database():
    """تحليل شامل لقاعدة البيانات بالأسماء الصحيحة"""
    print("🔍 بدء التحقق من قاعدة بيانات SocialPro (الأسماء الصحيحة)")
    print(f"📍 URL: {SUPABASE_URL}")
    print("=" * 80)
    
    results = {
        "connection_status": "unknown",
        "tables": {},
        "total_tables": 0,
        "working_tables": 0,
        "total_records": 0,
        "summary": {
            "critical_tables": 0,
            "core_tables": 0,
            "support_tables": 0
        }
    }
    
    # تصنيف الجداول
    critical_tables = ["profiles", "subscription_plans", "platforms", "features"]
    core_tables = ["campaigns", "subscriptions", "user_platforms", "plan_features"]
    support_tables = ["points_transactions", "invoices", "notifications", "activities", "api_keys", "reports"]
    
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
    print(f"\n📋 فحص الجداول ({len(CORRECT_TABLES)} جدول صحيح)")
    print("=" * 80)
    
    for table in CORRECT_TABLES:
        print(f"\n📊 فحص جدول: {table}")
        
        # تحديد فئة الجدول
        if table in critical_tables:
            category = "🔴 حرج"
            results["summary"]["critical_tables"] += 1
        elif table in core_tables:
            category = "🟡 أساسي"
            results["summary"]["core_tables"] += 1
        else:
            category = "🟢 مساعد"
            results["summary"]["support_tables"] += 1
        
        print(f"   📂 الفئة: {category}")
        
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
                
                if data and len(data) > 0:
                    first_record = data[0]
                    print(f"   🔍 الأعمدة ({len(first_record.keys())}):")
                    
                    for i, (key, value) in enumerate(first_record.items()):
                        if i < 5:  # عرض أول 5 أعمدة فقط
                            value_str = str(value)[:40] + "..." if len(str(value)) > 40 else str(value)
                            print(f"      • {key}: {value_str}")
                        elif i == 5:
                            print(f"      • ... و {len(first_record.keys()) - 5} أعمدة أخرى")
                            break
                
                results["tables"][table] = {
                    "status": "✅ متاح",
                    "category": category,
                    "sample_count": record_count,
                    "columns": list(first_record.keys()) if data else [],
                    "sample_data": data[:2] if data else []
                }
            else:
                print(f"   ⚠️  متاح لكن لا توجد بيانات")
                results["tables"][table] = {
                    "status": "⚠️  متاح فارغ",
                    "category": category,
                    "sample_count": 0,
                    "columns": [],
                    "sample_data": []
                }
        else:
            print(f"   ❌ غير موجود أو غير متاح")
            results["tables"][table] = {
                "status": "❌ غير متاح",
                "category": category,
                "sample_count": 0,
                "columns": [],
                "sample_data": []
            }
    
    # تقرير نهائي مفصل
    print("\n" + "=" * 80)
    print("📋 التقرير النهائي")
    print("=" * 80)
    print(f"🔗 حالة الاتصال: {results['connection_status']}")
    print(f"📊 إجمالي الجداول: {results['total_tables']}")
    print(f"✅ الجداول المتاحة: {results['working_tables']}")
    print(f"📝 إجمالي السجلات (عينة): {results['total_records']}")
    
    success_rate = (results["working_tables"] / results["total_tables"]) * 100 if results["total_tables"] > 0 else 0
    print(f"🎯 معدل النجاح: {success_rate:.1f}%")
    
    print(f"\n📂 توزيع الجداول:")
    print(f"   🔴 الحرجة: {results['summary']['critical_tables']}/4")
    print(f"   🟡 الأساسية: {results['summary']['core_tables']}/4") 
    print(f"   🟢 المساعدة: {results['summary']['support_tables']}/6")
    
    # حالة الجاهزية
    critical_working = sum(1 for table in CORRECT_TABLES if table in critical_tables and results["tables"].get(table, {}).get("status") == "✅ متاح")
    core_working = sum(1 for table in CORRECT_TABLES if table in core_tables and results["tables"].get(table, {}).get("status") == "✅ متاح")
    
    if critical_working >= 3 and core_working >= 2:
        readiness = "🟢 جاهز للاستخدام"
    elif critical_working >= 2:
        readiness = "🟡 جاهز جزئياً"
    else:
        readiness = "🔴 غير جاهز"
    
    print(f"\n🎯 حالة الجاهزية: {readiness}")
    
    # حفظ النتائج
    with open("/workspace/code/correct_database_check_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 تم حفظ التقرير في: /workspace/code/correct_database_check_results.json")
    
    return results

if __name__ == "__main__":
    analyze_correct_database()
