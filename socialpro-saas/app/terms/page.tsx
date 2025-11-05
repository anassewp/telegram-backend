import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للرئيسية
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          الشروط والأحكام
        </h1>
        <p className="text-neutral-600 mb-8">
          آخر تحديث: نوفمبر 2025
        </p>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              1. مقدمة
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              مرحباً بك في SocialPro. باستخدام خدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل البدء في استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              2. استخدام الخدمة
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              عند استخدام SocialPro، فإنك توافق على:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-700 mr-4">
              <li>استخدام الخدمة للأغراض القانونية فقط</li>
              <li>عدم نشر محتوى مسيء أو مخالف للقوانين</li>
              <li>احترام حقوق الملكية الفكرية للآخرين</li>
              <li>الحفاظ على سرية بيانات حسابك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              3. الحسابات والاشتراكات
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              يمكنك إنشاء حساب مجاني على المنصة. الخطط المدفوعة تخضع لشروط الدفع والإلغاء المذكورة في صفحة الأسعار. نحتفظ بالحق في تعديل الأسعار في أي وقت مع إشعار مسبق.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              4. المسؤولية
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              SocialPro ليست مسؤولة عن أي خسائر أو أضرار ناتجة عن استخدام الخدمة. نحن نوفر المنصة "كما هي" دون ضمانات صريحة أو ضمنية.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              5. إنهاء الخدمة
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              نحتفظ بالحق في تعليق أو إنهاء حسابك في حالة انتهاك هذه الشروط. يمكنك إلغاء حسابك في أي وقت من خلال إعدادات الحساب.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              6. التعديلات
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنقوم بإشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعارات المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              7. الاتصال بنا
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              إذا كان لديك أي أسئلة حول هذه الشروط، يرجى التواصل معنا عبر البريد الإلكتروني:
              <a href="mailto:support@socialpro.com" className="text-primary-600 hover:text-primary-700 font-medium mr-2">
                support@socialpro.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
