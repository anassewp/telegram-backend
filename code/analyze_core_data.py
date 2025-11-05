#!/usr/bin/env python3
"""
فحص البيانات الأساسية في قاعدة بيانات SocialPro
"""

import requests
import json
from urllib.parse import urljoin

SUPABASE_URL = "https://gigrtzamstdyynmvwljq.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc"

def make_supabase_request(endpoint, method="GET", data=None):
    url = urljoin(SUPABASE_URL, f"/rest/v1/{endpoint}")
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        return response.status_code, response.json()
    except Exception as e:
        return 500, {"error": str(e)}

def get_all_table_data(table_name):
    """جلب جميع البيانات من جدول"""
    try:
        status, data = make_supabase_request(f"{table_name}?select=*", "GET")
        return status == 200, data
    except:
        return False, None

def analyze_core_data():
    """تحليل البيانات الأساسية"""
    print("📊 تحليل البيانات الأساسية في قاعدة بيانات SocialPro")
    print("=" * 80)
    
    # فحص البيانات في الجداول الأساسية
    core_tables = ["subscription_plans", "platforms", "features", "plan_features"]
    
    results = {}
    
    for table in core_tables:
        print(f"\n📋 فحص جدول: {table}")
        print("-" * 50)
        
        success, data = get_all_table_data(table)
        if success and data:
            results[table] = {
                "count": len(data),
                "data": data
            }
            
            print(f"✅ عدد السجلات: {len(data)}")
            
            # عرض البيانات
            for i, record in enumerate(data, 1):
                print(f"\n📝 السجل {i}:")
                for key, value in record.items():
                    if key in ['id', 'name', 'name_en', 'slug', 'price', 'currency', 'features', 'description', 'icon_url']:
                        value_str = str(value)[:60] + "..." if len(str(value)) > 60 else str(value)
                        print(f"   {key}: {value_str}")
        else:
            print(f"❌ فشل في جلب البيانات")
            results[table] = {
                "count": 0,
                "data": []
            }
    
    # تقرير ملخص
    print("\n" + "=" * 80)
    print("📋 ملخص البيانات الأساسية")
    print("=" * 80)
    
    total_records = sum(r["count"] for r in results.values())
    print(f"📊 إجمالي السجلات: {total_records}")
    
    for table, info in results.items():
        print(f"   • {table}: {info['count']} سجل")
    
    # فحص اكتمال البيانات
    print(f"\n🎯 اكتمال البيانات:")
    
    subscription_plans_count = results.get("subscription_plans", {}).get("count", 0)
    platforms_count = results.get("platforms", {}).get("count", 0)
    features_count = results.get("features", {}).get("count", 0)
    plan_features_count = results.get("plan_features", {}).get("count", 0)
    
    print(f"   • خطط الاشتراك: {'✅ كامل' if subscription_plans_count >= 4 else f'⚠️  ناقص ({subscription_plans_count}/4)'}")
    print(f"   • المنصات: {'✅ كامل' if platforms_count >= 10 else f'⚠️  ناقص ({platforms_count}/12)'}")
    print(f"   • الميزات: {'✅ كامل' if features_count >= 10 else f'⚠️  ناقص ({features_count}/12)'}")
    print(f"   • ربط الميزات: {'✅ كامل' if plan_features_count >= 10 else f'⚠️  ناقص ({plan_features_count})'}")
    
    # حفظ النتائج
    with open("/workspace/code/core_data_analysis.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 تم حفظ التحليل في: /workspace/code/core_data_analysis.json")
    
    return results

if __name__ == "__main__":
    analyze_core_data()
