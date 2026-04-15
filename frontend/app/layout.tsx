import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "校线质量异常分析",
  description: "校线质量异常数据可视化和统计分析",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#f8f9fa] text-[#191c1d]">
        {children}
      </body>
    </html>
  );
}
