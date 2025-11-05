'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Check } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  benefits: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/data/features.json')
      .then(res => res.json())
      .then(data => {
        setFeatures(data.features);
        setCategories([
          { id: 'all', name: 'جميع الميزات', icon: '⚡' },
          ...data.feature_categories
        ]);
      });
  }, []);

  const filteredFeatures = selectedCategory === 'all'
    ? features
    : features.filter(f => f.category === selectedCategory);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-primary py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            جميع الميزات
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            اكتشف مجموعة شاملة من الأدوات والميزات المصممة لتعزيز حملاتك التسويقية ومضاعفة نتائجك
          </p>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="bg-white border-b border-neutral-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span className="ml-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFeatures.map((feature) => (
              <div
                key={feature.id}
                className="bg-white p-8 rounded-2xl border-2 border-neutral-200 hover:border-primary-500 transition-all card-hover"
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  {feature.name}
                </h3>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="border-t border-neutral-200 pt-6">
                  <h4 className="font-semibold text-neutral-900 mb-3">الفوائد:</h4>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700 text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {filteredFeatures.length === 0 && (
            <div className="text-center py-16">
              <p className="text-neutral-600 text-lg">لا توجد ميزات في هذه الفئة</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
            جرّب جميع الميزات مجاناً
          </h2>
          <p className="text-xl text-white/90 mb-8">
            ابدأ الآن واحصل على 100 نقطة هدية
          </p>
          <a
            href="/signup"
            className="inline-block px-10 py-4 bg-white text-secondary-600 rounded-xl font-bold text-lg btn-transition hover:shadow-2xl"
          >
            ابدأ مجاناً الآن
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
