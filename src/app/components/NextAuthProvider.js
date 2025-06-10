'use client'; // 声明为客户端组件

import { SessionProvider } from 'next-auth/react'; // 导入 SessionProvider

export default function NextAuthProvider({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}