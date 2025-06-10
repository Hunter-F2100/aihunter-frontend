import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// [ADDED] 详细的日志记录器，方便在日志中过滤
const log = (marker, message, data = '') => {
  console.log(`[NextAuth] ${marker}: ${message}`, data);
};

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        // [MODIFIED] 使用 email 作为登录字段，与前端和后端保持一致
        email: { label: "邮箱", type: "text", placeholder: "请输入邮箱" },
        password: { label: "密码", type: "password", placeholder: "请输入密码" },
      },
      async authorize(credentials, req) {
        log('Authorize', 'Function started.');
        
        if (!credentials?.email || !credentials?.password) {
          log('Authorize', 'Error: Missing credentials.');
          return null;
        }

        // [CRITICAL FIX] 使用环境变量中定义的生产环境后端URL，而不是写死的localhost
        const backendLoginUrl = `${process.env.NEXT_PUBLIC_API_URL}/login`; 
        log('Authorize', 'Attempting to connect to backend URL:', backendLoginUrl);

        try {
          const response = await fetch(backendLoginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // [FINAL FIX] 将键名从 'email' 改为 'username' 以匹配后端要求
              username: credentials.email, 
              password: credentials.password,
            }),
          });

          log('Authorize', 'Backend response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text(); // 先获取原始文本，防止JSON解析失败
            log('Authorize', 'Error: Backend request failed.', { status: response.status, body: errorText });
            return null; 
          }

          const data = await response.json();
          log('Authorize', 'Backend response JSON data:', data);

          // 假设后端返回 { success: true, user: { ... } } 或 { success: false, message: '...' }
          if (data && data.user) {
            log('Authorize', 'Success: Backend validation successful. Returning user object.');
            // 确保返回的用户对象与 callbacks 中使用的字段一致
            return {
              id: data.user.id,
              name: data.user.username, // NextAuth session 使用 'name'
              email: data.user.email,
              username: data.user.username, // 自定义字段
            };
          } else {
            log('Authorize', 'Error: Backend validation returned failure.', data.message || 'No user object in response.');
            return null;
          }
        } catch (error) {
          log('Authorize', 'FATAL: A network or fetch error occurred.', error);
          return null; 
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 当 authorize 成功返回 user 对象后，此回调被触发
      if (user) {
        log('JWT Callback', 'User object present, populating token.', user);
        token.id = user.id;
        token.username = user.username;
        // email 和 name 通常由 NextAuth 自动处理，但显式赋值更可靠
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // 每当 useSession() 被调用时，此回调被触发
      if (token && session.user) {
        log('Session Callback', 'Token present, populating session user.');
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },
  // Vercel 部署时 NODE_ENV 自动为 'production'，debug 会关闭。
  // 在这里手动打开可以在 Vercel 日志中看到 NextAuth 的内部调试信息，问题解决后再移除。
  debug: true, 
});

export { handler as GET, handler as POST };