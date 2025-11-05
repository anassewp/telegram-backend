'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Check, TrendingUp, Users, Zap, Shield } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billing_period_ar: string;
  popular: boolean;
  features_list: string[];
  cta: string;
}

export default function Home() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [pricing, setPricing] = useState<PricingPlan[]>([]);

  useEffect(() => {
    // تحميل البيانات
    fetch('/data/platforms.json')
      .then(res => res.json())
      .then(data => setPlatforms(data.platforms.slice(0, 10))); // أول 10 منصات فقط

    fetch('/data/features.json')
      .then(res => res.json())
      .then(data => setFeatures(data.features.slice(0, 6))); // أول 6 ميزات

    fetch('/data/pricing-plans.json')
      .then(res => res.json())
      .then(data => setPricing(data.plans));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-primary py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            أقوى منصة عربية للتسويق الإلكتروني<br />
            عبر جميع منصات التواصل الاجتماعي
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            أدِر حساباتك، أطلق حملاتك، وحلل نتائجك من مكان واحد.<br />
            وفّر الوقت وضاعف نتائجك مع أدوات تسويقية احترافية.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg btn-transition hover:shadow-2xl inline-flex items-center justify-center gap-2"
            >
              ابدأ مجاناً الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white rounded-xl font-bold text-lg btn-transition hover:bg-white/20 inline-flex items-center justify-center"
            >
              عرض الأسعار
            </Link>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-2">10,000+</div>
              <div className="text-white/80">مستخدم نشط</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-2">500K+</div>
              <div className="text-white/80">حملة ناجحة</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-2">12</div>
              <div className="text-white/80">منصة مدعومة</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-2">99.9%</div>
              <div className="text-white/80">وقت التشغيل</div>
            </div>
          </div>
        </div>
      </section>

      {/* المنصات المدعومة */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              المنصات المدعومة
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              تكامل كامل مع أشهر منصات التواصل الاجتماعي في العالم
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-white p-6 rounded-2xl border-2 border-neutral-200 hover:border-primary-500 transition-all card-hover text-center group"
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <Image
                    src={platform.icon}
                    alt={platform.name}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
                <h3 className="font-semibold text-neutral-800">{platform.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الميزات الرئيسية */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              ميزات قوية لتسويق أكثر فعالية
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              كل ما تحتاجه لإدارة حملاتك التسويقية بنجاح
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="p-6 rounded-2xl border border-neutral-200 hover:border-primary-500 transition-all card-hover"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                  {feature.name}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/features"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold btn-transition hover:bg-primary-700 inline-flex items-center gap-2"
            >
              عرض جميع الميزات
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* خطط الأسعار */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              خطط مرنة تناسب احتياجاتك
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              ابدأ مجاناً أو اختر الخطة المناسبة لعملك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white p-8 rounded-2xl ${
                  plan.popular
                    ? 'border-3 border-primary-500 shadow-xl relative'
                    : 'border-2 border-neutral-200'
                } transition-all card-hover`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 right-1/2 transform translate-x-1/2 bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                    الأكثر شعبية
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-primary-600">
                    ${plan.price}
                  </span>
                  <span className="text-neutral-600 mr-2">
                    / {plan.billing_period_ar}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features_list.slice(0, 5).map((feature, index) => (
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
                      : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-2"
            >
              مقارنة تفصيلية للخطط
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* لماذا SocialPro؟ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              لماذا SocialPro؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">سهل الاستخدام</h3>
              <p className="text-neutral-600">واجهة بسيطة وسهلة للجميع</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">نتائج مضمونة</h3>
              <p className="text-neutral-600">زيادة فعالية حملاتك بنسبة 300%</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">دعم 24/7</h3>
              <p className="text-neutral-600">فريق دعم محترف في خدمتك</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">أمان عالي</h3>
              <p className="text-neutral-600">بياناتك محمية بأعلى المعايير</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-gradient-rainbow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            جاهز لمضاعفة نتائجك؟
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            انضم لآلاف المسوقين الناجحين واب الآن بشكل مجاني
          </p>
          <Link
            href="/signup"
            className="px-10 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg btn-transition hover:shadow-2xl inline-flex items-center gap-2"
          >
            ابدأ مجاناً - 100 نقطة هدية
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
