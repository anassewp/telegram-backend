import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    المنتج: [
      { name: 'الميزات', href: '/features' },
      { name: 'الأسعار', href: '/pricing' },
      { name: 'التحديثات', href: '#' },
    ],
    الشركة: [
      { name: 'من نحن', href: '#' },
      { name: 'المدونة', href: '#' },
      { name: 'وظائف', href: '#' },
    ],
    الدعم: [
      { name: 'مركز المساعدة', href: '#' },
      { name: 'الأسئلة الشائعة', href: '#' },
      { name: 'اتصل بنا', href: '#' },
    ],
    القانونية: [
      { name: 'الشروط والأحكام', href: '#' },
      { name: 'سياسة الخصوصية', href: '#' },
      { name: 'سياسة الاسترجاع', href: '#' },
    ],
  };

  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <Image 
                src="/logo.png" 
                alt="SocialPro Logo" 
                width={40} 
                height={40} 
                className="object-contain"
              />
              <span className="text-2xl font-bold">SocialPro</span>
            </div>
            <p className="text-neutral-400 mb-6 leading-relaxed">
              أقوى منصة عربية للتسويق الإلكتروني عبر جميع منصات التواصل الاجتماعي.
              أدِر حساباتك، أطلق حملاتك، وحلل نتائجك من مكان واحد.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold text-lg mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 text-neutral-400">
              <Mail className="w-5 h-5 text-primary-500" />
              <span>support@socialpro.com</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-400">
              <Phone className="w-5 h-5 text-primary-500" />
              <span>+966 123 456 789</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-400">
              <MapPin className="w-5 h-5 text-primary-500" />
              <span>الرياض، المملكة العربية السعودية</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 pt-8 text-center text-neutral-400">
          <p>© {currentYear} SocialPro. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
