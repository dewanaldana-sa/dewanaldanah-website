import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ديوان الدانة للإنشاءات والمقاولات | شركة مقاولات رائدة في جدة",
  description: "شركة مقاولات سعودية رائدة متخصصة في الإنشاءات العامة والترميمات والأنظمة الكهربائية والميكانيكية. نُشيّد الثقة قبل أن نُشيّد المباني.",
  keywords: ["مقاولات", "إنشاءات", "جدة", "السعودية", "ترميمات", "كهرباء", "ميكانيكا", "تشطيبات"],
  authors: [{ name: "ديوان الدانة للإنشاءات والمقاولات" }],
  icons: {
    icon: "https://res.cloudinary.com/dwck4hd8b/image/upload/v1772011743/unnamed__32_-removebg-preview_h5k7vv.png",
  },
  openGraph: {
    title: "ديوان الدانة للإنشاءات والمقاولات",
    description: "شركة مقاولات سعودية رائدة متخصصة في الإنشاءات العامة والترميمات",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-transparent text-foreground font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
