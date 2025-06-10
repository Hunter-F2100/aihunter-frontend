import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "./components/NextAuthProvider"; // 导入 Provider

// 您的字体设置 (保留)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI 猎头搜索工具",
  description: "一个基于 AI 的猎头搜索工具",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 应用您的字体类名 (保留) */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 使用 NextAuthProvider 将整个应用 ({children}) 包裹起来。
          这解决了 `useSession` 必须在 `SessionProvider` 内的错误。
        */}
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
