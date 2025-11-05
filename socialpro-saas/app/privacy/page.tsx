import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PrivacyPage() {
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
          سياسة الخصوصية
        </h1>
        <p className="text-neutral-600 mb-8">
          آخر تحديث: نوفمبر 2025
        </p>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              1. المقدمة
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              في SocialPro، نحن نلتزم بحماية خصوصيتك وأمان بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام منصتنا.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              2. البيانات التي نجمعها
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              نقوم بجمع الأنواع التالية من البيانات:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-700 mr-4">
              <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، اسم الشركة</li>
              <li><strong>بيانات الاستخدام:</strong> كيفية استخدامك للمنصة، الميزات المفضلة</li>
              <li><strong>بيانات تقنية:</strong> عنوان IP، نوع المتصفح، نظام التشغيل</li>
              <li><strong>بيانات الدفع:</strong> معلومات الفواتير والاشتراكات (لا نخزن بيانات البطاقة)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              3. كيف نستخدم بياناتك
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              نستخدم معلوماتك للأغراض التالية:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-700 mr-4">
              <li>تقديم وتحسين خدماتنا</li>
              <li>إنشاء وإدارة حسابك</li>
              <li>معالجة المدفوعات والاشتراكات</li>
              <li>إرسال التحديثات والإشعارات المهمة</li>
              <li>تحليل استخدام المنصة لتحسين الأداء</li>
              <li>تقديم الدعم الفني</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              4. مشاركة البيانات
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              نحن لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط مع:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-700 mr-4 mt-3">
              <li>مزودي الخدمات الذين يساعدوننا في تشغيل المنصة</li>
              <li>السلطات القانونية عند الضرورة القانونية</li>
              <li>شركاء الدفع لمعالجة المعاملات</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              5. أمان البيانات
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              نستخدم إجراءات أمنية متقدمة لحماية بياناتك، بما في ذلك التشفير وجدران الحماية والمصادقة الآمنة. ومع ذلك، لا يمكن ضمان أمان 100% عبر الإنترنت.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              6. حقوقك
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              لديك الحقوق التالية بشأن بياناتك:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-700 mr-4">
              <li>الوصول إلى بياناتك الشخصية</li>
              <li>تصحيح البيانات غير الدقيقة</li>
              <li>حذف حسابك وبياناتك</li>
              <li>تصدير بياناتك</li>
              <li>الاعتراض على معالجة بياناتك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              7. ملفات تعريف الارتباط (Cookies)
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة، وتذكر تفضيلاتك، وتحليل الاستخدام. يمكنك التحكم في الكوكيز من إعدادات متصفحك.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              8. التعديلات على السياسة
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              قد نقوم بتحديث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              9. الاتصال بنا
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              إذا كانت لديك أسئلة حول سياسة الخصوصية أو تريد ممارسة حقوقك، يرجى التواصل معنا:
            </p>
            <div className="mt-3 text-neutral-700">
              <p>البريد الإلكتروني: 
                <a href="mailto:privacy@socialpro.com" className="text-primary-600 hover:text-primary-700 font-medium mr-2">
                  privacy@socialpro.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
