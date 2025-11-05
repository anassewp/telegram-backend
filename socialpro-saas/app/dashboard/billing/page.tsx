'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CreditCard,
  Download,
  Calendar,
  Check,
  Crown,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  features_list: string[];
  is_popular?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  invoice_number: string;
  period: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expiry?: string;
  email?: string;
  is_default: boolean;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currentPlan, setCurrentPlan] = useState('free');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PricingPlan | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load pricing plans
      const plansResponse = await fetch('/data/pricing-plans.json');
      const plansData = await plansResponse.json();
      setPlans(plansData);

      // Load mock invoices
      setInvoices([
        {
          id: '1',
          date: '2025-10-01',
          amount: 299,
          status: 'paid',
          plan: 'الخطة الشهرية',
          invoice_number: 'INV-2025-001',
          period: 'أكتوبر 2025',
        },
        {
          id: '2',
          date: '2025-09-01',
          amount: 299,
          status: 'paid',
          plan: 'الخطة الشهرية',
          invoice_number: 'INV-2025-002',
          period: 'سبتمبر 2025',
        },
        {
          id: '3',
          date: '2025-08-01',
          amount: 299,
          status: 'paid',
          plan: 'الخطة الشهرية',
          invoice_number: 'INV-2025-003',
          period: 'أغسطس 2025',
        },
      ]);

      // Load mock payment methods
      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiry: '12/2026',
          is_default: true,
        },
        {
          id: '2',
          type: 'paypal',
          email: 'user@example.com',
          is_default: false,
        },
      ]);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan: PricingPlan) => {
    setSelectedPlanForUpgrade(plan);
    setShowUpgradeModal(true);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    alert(`سيتم تحميل الفاتورة ${invoiceId} كملف PDF. هذه ميزة محاكاة في النسخة التجريبية.`);
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
  };

  const handleRemovePaymentMethod = (methodId: string) => {
    if (confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
      setPaymentMethods(paymentMethods.filter((m) => m.id !== methodId));
    }
  };

  const handleSetDefaultPayment = (methodId: string) => {
    setPaymentMethods(
      paymentMethods.map((m) => ({
        ...m,
        is_default: m.id === methodId,
      }))
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(price);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
    };
    const labels = {
      paid: 'مدفوعة',
      pending: 'قيد الانتظار',
      failed: 'فشلت',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الفواتير والاشتراكات</h1>
        <p className="text-gray-600 mt-1">إدارة خطة اشتراكك وطرق الدفع</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-primary to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-6 h-6" />
              <span className="text-sm font-medium opacity-90">خطتك الحالية</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">الخطة الشهرية</h2>
            <p className="text-lg opacity-90">
              {formatPrice(299)} / شهرياً
            </p>
          </div>
          <button
            onClick={() => handleUpgrade(plans.find((p) => p.id === 'annual') || plans[0])}
            className="px-6 py-2 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            ترقية الخطة
          </button>
        </div>
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-80">المنصات المتاحة</p>
                <p className="text-xl font-bold">12 منصة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-80">النقاط المتبقية</p>
                <p className="text-xl font-bold">2,500 نقطة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-80">تاريخ التجديد</p>
                <p className="text-xl font-bold">1 نوفمبر 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Plans */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">خطط الترقية المتاحة</h2>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              سنوي
              <span className="mr-1 text-xs text-green-600">(وفر 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans
            .filter((plan) => plan.id !== 'free')
            .map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                  plan.is_popular
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-primary/50'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-4 right-1/2 translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      الأكثر شعبية
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-primary">
                      {billingCycle === 'monthly'
                        ? formatPrice(plan.price_monthly)
                        : formatPrice(plan.price_annual)}
                    </span>
                    <span className="text-gray-600">
                      / {billingCycle === 'monthly' ? 'شهر' : 'سنة'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-600 mt-1">
                      وفر {formatPrice((plan.price_monthly * 12 - plan.price_annual))} سنوياً
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features_list.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan)}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    plan.is_popular
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {currentPlan === plan.id ? 'الخطة الحالية' : 'ترقية للخطة'}
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">طرق الدفع</h2>
          <button
            onClick={handleAddPaymentMethod}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة طريقة دفع
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`relative border-2 rounded-xl p-4 transition-all ${
                method.is_default
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {method.is_default && (
                <div className="absolute -top-2 -right-2">
                  <span className="px-2 py-1 bg-primary text-white text-xs font-bold rounded-full">
                    الافتراضية
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    {method.type === 'card' ? (
                      <>
                        <p className="font-medium text-gray-900">
                          {method.brand} •••• {method.last4}
                        </p>
                        <p className="text-sm text-gray-600">تنتهي في {method.expiry}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-gray-900">PayPal</p>
                        <p className="text-sm text-gray-600">{method.email}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.is_default && (
                    <button
                      onClick={() => handleSetDefaultPayment(method.id)}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      جعلها افتراضية
                    </button>
                  )}
                  <button
                    onClick={() => handleRemovePaymentMethod(method.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">سجل الفواتير</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  رقم الفاتورة
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  التاريخ
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  الفترة
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  الخطة
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  المبلغ
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  الحالة
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(invoice.date).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{invoice.period}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{invoice.plan}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatPrice(invoice.amount)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      تحميل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">إضافة طريقة دفع</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم البطاقة
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم حامل البطاقة
                </label>
                <input
                  type="text"
                  placeholder="الاسم كما يظهر على البطاقة"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-primary border-gray-300 rounded" />
                <span className="text-sm text-gray-700">جعل هذه طريقة الدفع الافتراضية</span>
              </label>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  alert('تمت إضافة طريقة الدفع بنجاح!');
                  setShowAddPaymentModal(false);
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">ترقية الاشتراك</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">ترقية إلى:</p>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {selectedPlanForUpgrade.name}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(
                    billingCycle === 'monthly'
                      ? selectedPlanForUpgrade.price_monthly
                      : selectedPlanForUpgrade.price_annual
                  )}
                  <span className="text-sm font-normal text-gray-600">
                    {' '}
                    / {billingCycle === 'monthly' ? 'شهر' : 'سنة'}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">سيتم الخصم من:</p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-900">Visa •••• 4242</span>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ سيتم تطبيق الترقية فوراً وسيتم خصم المبلغ المتناسب من الوقت المتبقي في
                  دورتك الحالية.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  alert('تمت ترقية الاشتراك بنجاح!');
                  setShowUpgradeModal(false);
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                تأكيد الترقية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
