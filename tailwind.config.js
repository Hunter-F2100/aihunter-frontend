/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}', // 确保这一行在！
  ],
  theme: {
    extend: {
      colors: {
  'logo-blue': '#1758D2', // 先保留这个，万一成功了呢
  'logo-blue-darker': '#1246AA', // 先保留这个
  'initial-blue': '#0070f3', // 这是 Next.js 默认的蓝色
  'initial-blue-darker': '#0059b3', // 这是稍微深一点的版本
},
    },
  },
  plugins: [],
};