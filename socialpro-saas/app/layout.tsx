import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SocialPro - أقوى منصة عربية للتسويق الإلكتروني",
  description: "أدِر حساباتك، أطلق حملاتك، وحلل نتائجك من مكان واحد. وفّر الوقت وضاعف نتائجك مع أدوات تسويقية احترافية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
