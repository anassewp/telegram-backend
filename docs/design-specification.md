# مواصفات التصميم الكاملة - نظام SaaS للتسويق الإلكتروني

## 🎨 نظام التصميم العام

### الهوية البصرية
- **الألوان الرئيسية**: بنفسجي (#9D4EDD) + أزرق (#3B82F6)
- **النمط**: عصري، احترافي، نظيف
- **الاتجاه**: RTL (من اليمين لليسار) - عربي
- **الخطوط**: Cairo للعربية، Inter للإنجليزية

---

## 📐 المكونات الأساسية (Components)

### 1. الأزرار (Buttons)

#### Primary Button
```
الحجم: padding: 12px 24px
الخط: 16px، bold
اللون: background: #9D4EDD, text: #FFFFFF
Border Radius: 8px
Shadow: 0 4px 6px rgba(157, 78, 221, 0.25)
Hover: background: #7E3AF2, scale: 1.02
```

#### Secondary Button
```
الحجم: padding: 12px 24px
الخط: 16px، semibold
اللون: background: transparent, text: #9D4EDD, border: 2px solid #9D4EDD
Border Radius: 8px
Hover: background: #F3E8FF
```

#### Outline Button
```
الحجم: padding: 10px 20px
الخط: 14px، medium
اللون: background: transparent, text: #6B7280, border: 1px solid #E5E7EB
Border Radius: 6px
Hover: border: #9D4EDD, text: #9D4EDD
```

### 2. البطاقات (Cards)

#### Standard Card
```
Background: #FFFFFF
Border: 1px solid #E5E7EB
Border Radius: 12px
Padding: 24px
Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
Hover: Shadow: 0 10px 15px rgba(0, 0, 0, 0.1), transform: translateY(-2px)
```

#### Platform Card
```
Background: #FFFFFF
Border: 2px solid #E5E7EB
Border Radius: 16px
Padding: 20px
Text Align: center
Icon Size: 64px
Shadow: 0 4px 6px rgba(0, 0, 0, 0.05)
Hover: Border: platform color, Shadow: 0 8px 12px rgba(0, 0, 0, 0.1)
```

#### Pricing Card
```
Background: #FFFFFF
Border: 2px solid #E5E7EB
Border Radius: 20px
Padding: 32px
Min Height: 600px
Shadow: 0 4px 6px rgba(0, 0, 0, 0.05)
Popular Badge: position: absolute, top: -12px, background: gradient
```

### 3. النماذج (Forms)

#### Input Field
```
Height: 48px
Padding: 12px 16px
Font Size: 16px
Border: 1px solid #E5E7EB
Border Radius: 8px
Background: #FFFFFF
Focus: Border: 2px solid #9D4EDD, shadow: 0 0 0 3px rgba(157, 78, 221, 0.1)
```

#### Text Area
```
Min Height: 120px
Padding: 12px 16px
Font Size: 16px
Border: 1px solid #E5E7EB
Border Radius: 8px
Resize: vertical
```

#### Checkbox/Radio
```
Size: 20px
Border: 2px solid #E5E7EB
Border Radius: 4px (checkbox) / 50% (radio)
Checked: Background: #9D4EDD, border: #9D4EDD
```

### 4. التنقل (Navigation)

#### Header/Navbar
```
Height: 72px
Background: #FFFFFF
Border Bottom: 1px solid #E5E7EB
Shadow: 0 1px 3px rgba(0, 0, 0, 0.05)
Sticky: yes
Z-Index: 1000
```

#### Sidebar (Dashboard)
```
Width: 280px
Background: #FFFFFF
Border Left: 1px solid #E5E7EB (RTL)
Height: 100vh
Sticky: yes
```

#### Footer
```
Background: #111827
Color: #FFFFFF
Padding: 64px 0 32px 0
```

---

## 📄 تصميم الصفحات

### 1. الصفحة الرئيسية (Home Page)

#### Hero Section
```
Height: 600px
Background: gradient (primary to secondary)
Text Align: center
Padding: 80px 20px

العناصر:
- العنوان الرئيسي: font-size: 56px, font-weight: 800, color: #FFFFFF
- العنوان الفرعي: font-size: 20px, font-weight: 400, color: rgba(255,255,255,0.9)
- CTAs: 2 أزرار (Primary + Outline White)
- صورة/رسم توضيحي: أسفل النص
```

#### المنصات المدعومة
```
Background: #F9FAFB
Padding: 80px 20px

العنوان: font-size: 36px, font-weight: 700, text-align: center, margin-bottom: 48px

Grid:
- Desktop: 6 أعمدة (6 منصات في الصف)
- Tablet: 4 أعمدة
- Mobile: 2 أعمدة
- Gap: 24px

كل منصة:
- Platform Card (انظر المكونات)
- أيقونة + اسم
- Hover effect: تكبير الأيقونة
```

#### الميزات الرئيسية
```
Background: #FFFFFF
Padding: 100px 20px

Grid: 3 أعمدة (Desktop), 2 (Tablet), 1 (Mobile)

كل ميزة:
- أيقونة: 48px, color: primary
- عنوان: font-size: 24px, font-weight: 600
- وصف: font-size: 16px, color: #6B7280
- Spacing: 32px بين العناصر
```

#### خطط الأسعار (عرض سريع)
```
Background: #F9FAFB
Padding: 80px 20px

Grid: 4 بطاقات (Desktop), 2 (Tablet), 1 (Mobile)
Card: Pricing Card المبسطة
- اسم الخطة
- السعر (font-size: 48px)
- 3-5 ميزات رئيسية
- زر CTA
```

#### الإحصائيات
```
Background: primary gradient
Padding: 60px 20px
Text Align: center
Color: #FFFFFF

Grid: 4 أعمدة (Desktop), 2 (Tablet), 1 (Mobile)

كل إحصائية:
- رقم كبير: font-size: 48px, font-weight: 800
- وصف: font-size: 16px
- أيقونة صغيرة
```

#### FAQ Section
```
Background: #FFFFFF
Padding: 80px 20px
Max Width: 800px
Margin: center

Accordion:
- Border: 1px solid #E5E7EB
- Border Radius: 12px
- Padding: 20px
- Margin: 16px 0
- سؤال: font-size: 18px, font-weight: 600
- إجابة: font-size: 16px, color: #6B7280
- أيقونة +/- على اليمين
```

### 2. صفحة الميزات (Features Page)

```
Layout: Header + عنوان الصفحة + Grid الميزات

Header Section:
- Background: gradient
- Padding: 100px 20px
- Title: "جميع الميزات"
- Subtitle: وصف قصير

Features Grid:
- Grid: 3 أعمدة (Desktop)
- Card لكل ميزة
- أيقونة كبيرة (64px) + عنوان + وصف مفصل + قائمة فوائد
- Border: 2px على hover

Categories:
- Tabs في الأعلى لفلترة الميزات حسب الفئة
- Active Tab: background: primary, color: white
```

### 3. صفحة الأسعار (Pricing Page)

```
Layout: Header + Toggle (شهري/سنوي) + Pricing Cards + جدول مقارنة + FAQ

Toggle Switch:
- Position: center
- Size: padding: 8px 16px
- Background: #E5E7EB
- Active: background: #9D4EDD, color: white
- Badge "وفّر 17%" على السنوي

Pricing Cards:
- 4 بطاقات في صف واحد
- Popular Card: Border: 3px solid primary, Badge في الأعلى
- Height: متساوية
- Features: قائمة بعلامات ✓
- CTA Button في الأسفل

Comparison Table:
- Desktop only (يخفى على موبايل)
- Header: أسماء الخطط
- Rows: الميزات
- Checkmarks: ✓ أخضر / ✗ رمادي
```

### 4. صفحة تسجيل الدخول (Login Page)

```
Layout: Split Screen (Desktop) / Full (Mobile)

Left Side (Desktop):
- Background: primary gradient
- Illustration: رسم توضيحي
- نص ترحيبي
- Width: 40%

Right Side:
- Background: white
- Width: 60%
- Max Width Form: 400px
- Center aligned

Form:
- Logo في الأعلى
- عنوان: "تسجيل الدخول"
- Email Input
- Password Input (مع عرض/إخفاء)
- Checkbox "تذكرني"
- زر "تسجيل الدخول"
- Divider: "أو"
- زر "تسجيل الدخول بـ Google" (أيقونة + نص)
- روابط: "نسيت كلمة المرور" | "إنشاء حساب جديد"
```

### 5. صفحة التسجيل (Signup Page)

```
مشابه لصفحة Login

Form:
- الاسم الكامل
- البريد الإلكتروني
- اسم الشركة (اختياري)
- كلمة المرور
- تأكيد كلمة المرور
- Checkbox: "أوافق على الشروط والأحكام"
- زر "إنشاء حساب"
- Divider: "أو"
- زر "التسجيل بـ Google"
- رابط: "لديك حساب؟ تسجيل الدخول"
```

### 6. لوحة التحكم (Dashboard)

```
Layout: Sidebar + Header + Main Content

Header:
- Height: 72px
- Search Bar في الوسط
- Notifications Icon + User Menu على اليمين

Sidebar:
- Logo في الأعلى
- Navigation Links
- Active Link: background: #F3E8FF, border-right: 4px solid primary
- أيقونة + نص

Main Content:
- Padding: 32px
- Background: #F9FAFB

Stats Cards Row:
- 4 بطاقات
- أيقونة ملونة + قيمة كبيرة + عنوان + نسبة التغير

Charts Section:
- 2 أعمدة
- Recharts / Chart.js
- Border Radius: 12px
- Padding: 24px

Recent Activities:
- Table / List
- Avatar + نص + تاريخ
- Max Height: 400px, scroll
```

### 7. صفحة إدارة المنصات (Platforms)

```
Layout: Grid المنصات

Header:
- عنوان + زر "ربط منصة جديدة"

Grid: 3 أعمدة

Platform Card:
- أيقونة المنصة (كبيرة)
- اسم المنصة
- حالة الاتصال:
  * متصل: Badge أخضر + "مربوط"
  * غير متصل: Badge رمادي + "غير مربوط"
- زر "ربط" / "فصل"
- إحصائيات (إذا كان مربوط):
  * عدد المتابعين
  * آخر نشاط
```

### 8. صفحة الحملات (Campaigns)

```
Layout: Header + Filters + Table/Grid

Header:
- عنوان + زر "إنشاء حملة جديدة"

Filters:
- Search Input
- Dropdown: حالة الحملة (الكل، نشطة، منتهية، مجدولة)
- Dropdown: المنصة
- Date Range Picker

Table:
Columns:
- اسم الحملة
- المنصة (أيقونة + اسم)
- الحالة (Badge ملون)
- التاريخ
- الإحصائيات (Clicks, Views, CTR)
- إجراءات (عرض، تحرير، حذف)

Pagination:
- في الأسفل
- 10/20/50 لكل صفحة
```

---

## 🎭 الحركات والتفاعلات (Animations)

### Page Load
- Fade In: opacity 0 to 1, duration: 300ms
- Slide Up: translateY(20px) to 0, duration: 400ms

### Hover Effects
- Buttons: scale(1.02), duration: 150ms
- Cards: translateY(-4px), shadow increase, duration: 200ms
- Links: color change, duration: 150ms

### Transitions
- All: cubic-bezier(0.4, 0, 0.2, 1)
- Colors: 150ms
- Transform: 200ms
- Shadow: 200ms

---

## 📱 الاستجابة (Responsive Design)

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adjustments
- Font sizes: تقليل 2-4px
- Padding: تقليل 20-30%
- Grid: 1 عمود للمعظم
- Sidebar: Drawer قابل للفتح
- Hero font-size: 36px بدلاً من 56px

---

## 🌈 التدرجات والخلفيات (Gradients & Backgrounds)

### Primary Gradient
```
background: linear-gradient(135deg, #9D4EDD 0%, #C084FC 100%)
```

### Secondary Gradient
```
background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)
```

### Rainbow Gradient (للعناصر البارزة)
```
background: linear-gradient(135deg, #9D4EDD 0%, #3B82F6 50%, #F59E0B 100%)
```

### Mesh Background (للـ Hero)
```
background: 
  radial-gradient(circle at 20% 50%, rgba(157,78,221,0.3) 0%, transparent 50%),
  radial-gradient(circle at 80% 80%, rgba(59,130,246,0.3) 0%, transparent 50%),
  linear-gradient(135deg, #9D4EDD 0%, #3B82F6 100%)
```

---

## ✅ قائمة التحقق من الجودة

- [ ] جميع الألوان متوافقة مع WCAG 2.1 (Contrast Ratio > 4.5:1)
- [ ] جميع الأزرار والروابط لها focus states واضحة
- [ ] جميع الصور لها alt text
- [ ] جميع النماذج لها labels واضحة
- [ ] الموقع يعمل بشكل كامل على RTL
- [ ] جميع الأيقونات واضحة ومفهومة
- [ ] Loading states لجميع العمليات
- [ ] Error states واضحة ومفيدة
- [ ] Success messages مطمئنة
- [ ] الموقع responsive على جميع الأحجام

---

تاريخ الإنشاء: 2025-11-01
الإصدار: 1.0
