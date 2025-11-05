'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Check, X } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  billing_period_ar: string;
  popular: boolean;
  badge?: string;
  savings?: string;
  features_list: string[];
  ideal_for: string;
  cta: string;
  features: {
    max_platforms: number | string;
    max_campaigns: number | string;
    max_contacts: number | string;
    bulk_messaging: string;
    analytics: boolean;
    priority_support: boolean;
    api_access: boolean;
    custom_reports: boolean;
    points_system: boolean;
    data_export: boolean;
    white_label: boolean;
  };
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetch('/data/pricing-plans.json')
      .then(res => res.json())
      .then(data => setPlans(data.plans));
  }, []);

  const comparisonFeatures = [
    { key: 'max_platforms', name: 'عدد المنصات' },
    { key: 'max_campaigns', name: 'الحملات الشهرية' },
    { key: 'max_contacts', name: 'جهات الاتصال' },
    { key: 'bulk_messaging', name: 'الرسائل الجماعية' },
    { key: 'analytics', name: 'تحليلات متقدمة' },
    { key: 'priority_support', name: 'دعم ذو أولوية' },
    { key: 'api_access', name: 'واجهة برمجية API' },
    { key: 'custom_reports', name: 'تقارير مخصصة' },
    { key: 'data_export', name: 'تصدير البيانات' },
    { key: 'white_label', name: 'علامة تجارية مخصصة' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-primary py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            اختر الخطة المناسبة لك
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            خطط مرنة تناسب جميع الأحجام - من الأفراد إلى المؤسسات الكبيرة
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm p-2 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              شهرياً
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              سنوياً
              <span className="px-2 py-1 bg-accent-500 text-white text-xs rounded-full">
                وفّر 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white p-8 rounded-2xl ${
                  plan.popular
                    ? 'border-3 border-primary-500 shadow-xl relative ring-4 ring-primary-100'
                    : 'border-2 border-neutral-200'
                } transition-all card-hover`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 right-1/2 transform translate-x-1/2 bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                  {plan.name}
                </h3>
                
                <div className="mb-6">
                  {plan.original_price && (
                    <div className="text-neutral-400 line-through text-lg">
                      ${plan.original_price}
                    </div>
                  )}
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-primary-600">
                      ${plan.price}
                    </span>
                    <span className="text-neutral-600 mr-2">
                      / {plan.billing_period_ar}
                    </span>
                  </div>
                  {plan.savings && (
                    <div className="text-green-600 font-semibold mt-1">
                      {plan.savings}
                    </div>
                  )}
                </div>

                <p className="text-sm text-neutral-600 mb-6 pb-6 border-b border-neutral-200">
                  {plan.ideal_for}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features_list.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block text-center px-6 py-3 rounded-lg font-semibold btn-transition ${
                    plan.popular
                      ? 'bg-gradient-primary text-white hover:shadow-primary'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table (Desktop Only) */}
      <section className="py-16 bg-white hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            مقارنة تفصيلية للخطط
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-300">
                  <th className="text-right p-4 font-bold text-neutral-900">الميزة</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="p-4 text-center">
                      <div className="font-bold text-lg text-neutral-900">{plan.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={feature.key} className={index % 2 === 0 ? 'bg-neutral-50' : ''}>
                    <td className="p-4 font-medium text-neutral-700">{feature.name}</td>
                    {plans.map((plan) => {
                      const value = plan.features[feature.key as keyof typeof plan.features];
                      return (
                        <td key={plan.id} className="p-4 text-center">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check className="w-6 h-6 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-6 h-6 text-neutral-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-neutral-700">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            أسئلة شائعة حول الأسعار
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'هل يمكنني تجربة النظام مجاناً؟',
                a: 'نعم! نقدم خطة مجانية مدى الحياة تشمل 3 منصات و 5 حملات شهرياً. يمكنك الترقية في أي وقت.'
              },
              {
                q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟',
                a: 'نعم، يمكنك إلغاء اشتراكك في أي وقت دون أي رسوم إضافية.'
              },
              {
                q: 'ما طرق الدفع المتاحة؟',
                a: 'نقبل بطاقات الائتمان/الخصم (Visa, Mastercard)، PayPal، والتحويلات البنكية.'
              },
              {
                q: 'هل يوجد خصومات للخطط السنوية؟',
                a: 'نعم! احصل على خصم 17% عند الاشتراك السنوي.'
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-xl border border-neutral-200 p-6 group"
              >
                <summary className="font-bold text-lg text-neutral-900 cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-neutral-600 mt-4 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-rainbow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
            جاهز للبدء؟
          </h2>
          <p className="text-xl text-white/90 mb-8">
            اختر خطتك وابدأ اليوم - بدون الحاجة لبطاقة ائتمان
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg btn-transition hover:shadow-2xl"
          >
            ابدأ مجاناً الآن
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
