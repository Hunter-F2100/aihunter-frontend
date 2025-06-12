// 文件路径: src/app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js"; // [新变化] 导入 Supabase 客户端

// 保留您优秀的日志记录习惯
const log = (marker, message, data = '') => {
  console.log(`[NextAuth] ${marker}: ${message}`, data);
};

const handler = NextAuth({
  // 会话管理策略，保持 jwt 不变
  session: {
    strategy: "jwt",
  },

  // 身份验证提供者配置
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        // 这里定义的字段，对应您登录页面 signIn 函数传入的对象
        // 虽然您前端叫 username，但 Supabase 认证需要的是 email，我们会自动转换
        username: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      // [核心修改] 这是我们重写的 authorize 函数，现在它将直接与 Supabase 对话
      async authorize(credentials, req) {
        log('Authorize', '启动 Supabase 认证逻辑。');

        // [新增的日志探针] 这一行会把前端发来的账号密码原样打印在终端里
        

        // 确保前端发送了必要的凭证
        if (!credentials?.username || !credentials?.password) {
          log('Authorize', '错误: 缺少用户名或密码。');
          return null; // 返回 null 表示认证失败
        }

        // 在函数内部，安全地初始化一个 Supabase 客户端
        // 我们需要读取 .env.local 中的环境变量来连接
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        log('Authorize', '尝试使用 Supabase 进行登录...');

        // 调用 Supabase 的核心登录函数
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.username, // 将前端传来的 username 作为 email 使用
          password: credentials.password,
        });

        // [第一重判断] 检查 Supabase 是否返回了错误
        if (error) {
          log('Authorize', '错误: Supabase 登录失败。', error.message);
          return null; // 认证失败
        }

        // [第二重判断] 检查是否成功获取了用户信息
        if (data?.user) {
          log('Authorize', '成功: Supabase 验证通过。');
          // 认证成功！
          // 返回一个符合 NextAuth 要求的用户对象。
          // 这个对象会被传递给下面的 jwt 回调函数。
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.email, // Supabase 用户默认没有 name 字段，我们暂时用 email 代替
          };
        }

        // 如果既没有错误，也没有 user 数据，也视为失败
        log('Authorize', '错误: 未从 Supabase 收到用户数据。');
        return null;
      },
    }),
  ],

  // Callbacks 回调函数，这部分逻辑与您原来的一致，无需修改
  // 它负责将 authorize 返回的用户信息写入会话（Session）中
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },

  // [新变化] 使用我们 .env.local 文件中新增的密钥，增强安全性
  secret: process.env.NEXTAUTH_SECRET,

  // 在开发环境中开启详细日志，方便调试
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
