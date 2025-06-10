// 声明为客户端组件，以使用 React Hooks 和事件处理
'use client';

// 【修复】强制页面进行动态渲染，以解决 useSearchParams 在部署时的静态预渲染冲突问题
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react'; // 【修复】确保 useEffect 被正确导入
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// --- 主页面组件 ---
const HomePage = () => {
  // --- Hooks 统一声明区 ---
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession(); // status: 'loading', 'authenticated', 'unauthenticated'

  // --- 登录表单状态 ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- 搜索功能状态 ---
  const [searchText, setSearchText] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // --- 常量定义 ---
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  const ITEMS_PER_PAGE = 10;
  const COMPANY_LOGO_PATH = '/HLG-logo.png';
  const LOGO_BLUE_COLOR_CLASS = 'bg-blue-600 hover:bg-blue-700';

  // --- 认证相关函数 ---
  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const result = await signIn('credentials', {
        username: username,
        password,
        redirect: false,
      });
      if (result?.error) {
        setLoginError('用户名或密码错误，请重试。');
      } else {
        // 登录成功后清空表单
        setUsername('');
        setPassword('');
      }
    } catch (error) {
      console.error('登录时发生意外错误:', error);
      setLoginError('登录时发生网络或未知错误。');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    router.push('/'); // 退出时清空 URL 参数
    signOut({ callbackUrl: '/' });
  };
  
  // --- 核心搜索函数 (由 URL 参数驱动) ---
  const performSearch = async (query, page) => {
    if (!query) {
      // 外部已处理，此函数仅在 query 有效时调用
      return;
    }

    setLoading(true);
    setSearchError(null);
    setIsInitialLoad(false);

    const backendUrl = `${API_BASE_URL}/search?q=${query}&page=${page}`;

    try {
      const response = await fetch(backendUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '无法解析错误信息。' }));
        throw new Error(errorData.message || `请求失败，状态码: ${response.status}`);
      }
      const data = await response.json();
      setCandidates(data.candidates || []);
      setTotalPages(Math.ceil((data.total_count || 0) / ITEMS_PER_PAGE));
      setCurrentPage(page);
    } catch (err) {
      console.error("搜索请求失败:", err);
      setSearchError(`搜索失败: ${err.message || "未知错误，请检查后端服务是否正常运行。"}`);
      setCandidates([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect 用于监听 URL 和会话状态变化 ---
  useEffect(() => {
    // 只有在用户已认证的情况下才处理搜索逻辑
    if (status === 'authenticated') {
      const queryFromUrl = searchParams.get('q');
      const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
      
      // 同步输入框内容与 URL 参数
      setSearchText(queryFromUrl || '');
      
      if (queryFromUrl) {
        performSearch(queryFromUrl, pageFromUrl);
      } else {
        // 如果已登录但 URL 中没有 query，则清空结果并显示初始提示
        setCandidates([]);
        setTotalPages(0);
        setCurrentPage(1);
        setIsInitialLoad(true);
        setSearchError(null);
      }
    }
  }, [searchParams, status]); // 依赖项：URL 参数和会话状态

  // --- 事件处理器 (只负责更新 URL) ---
  const handleSearchClick = () => {
    if (!searchText.trim()) {
      setSearchError('请输入有效的搜索关键词。');
      return;
    }
    router.push(`/?q=${searchText}&page=1`);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') handleSearchClick();
  };

  const handlePageChange = (newPage) => {
    const currentQuery = searchParams.get('q');
    if (currentQuery && !loading) {
      router.push(`/?q=${currentQuery}&page=${newPage}`);
    }
  };

  // --- 渲染逻辑 ---

  // 在确定会话状态前，显示全局加载提示，防止页面闪烁
  if (status === 'loading') {
    return (
        <div className="min-h-screen flex justify-center items-center bg-white">
            <p className="text-gray-500 text-xl font-semibold">会话加载中...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-4 sm:p-8 pt-16 sm:pt-20">
      <header className="w-full max-w-4xl flex items-center justify-center mb-10">
        <div className="flex items-center">
          {COMPANY_LOGO_PATH && (
            <Image src={COMPANY_LOGO_PATH} alt="HLG Logo" width={90} height={90} className="mr-4" priority />
          )}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">猎头搜索工具</h1>
        </div>
      </header>
      
      {/* 根据会话状态显示登录表单或搜索工具 */}
      {status === 'unauthenticated' ? (
        <main className="w-full max-w-sm">
          <form onSubmit={handleLoginSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">请登录</h2>
            {loginError && <p className="text-red-500 text-xs italic text-center mb-4">{loginError}</p>}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">用户名</label>
              <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Username" />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">密码</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" placeholder="******************" />
            </div>
            <div className="flex items-center justify-between">
              <button type="submit" disabled={isLoggingIn} className={`${LOGO_BLUE_COLOR_CLASS} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50`}>
                {isLoggingIn ? '登录中...' : '登录'}
              </button>
            </div>
            <p className="text-center text-gray-500 text-xs mt-4">测试账号: `admin` / `password123`</p>
          </form>
        </main>
      ) : (
        <main className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-6 px-2">
            <p className="text-gray-600">欢迎, <span className="font-semibold">{session?.user?.name || session?.user?.email}</span>!</p>
            <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors duration-200">退出</button>
          </div>
          <div className="w-full max-w-xl flex items-center space-x-3 mx-auto">
            <input type="text" placeholder="请输入英文关键词..." value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyPress={handleKeyPress} className="flex-grow p-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-transparent text-lg text-gray-700 placeholder-gray-400" />
            <button onClick={handleSearchClick} disabled={loading} className={`${LOGO_BLUE_COLOR_CLASS} text-white px-8 py-4 rounded-xl shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-opacity-60 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}>
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
          <div className="mt-10">
            {loading && <p className="text-center text-gray-600 mt-12 text-lg">正在加载候选人...</p>}
            {searchError && <p className="text-center text-red-600 mt-12 text-lg font-medium">{searchError}</p>}
            {isInitialLoad && !loading && !searchError && (<p className="text-center text-gray-500 mt-12">请输入关键词，开始搜索。</p>)}
            {!loading && !isInitialLoad && candidates.length === 0 && !searchError && (<p className="text-center text-gray-500 mt-12">没有找到符合条件的候选人。</p>)}
            {!loading && candidates.length > 0 && (
              <div className="grid grid-cols-1 gap-6">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center space-y-4 w-full md:w-36">
                      <Image src={candidate.githubAvatar || '/default-avatar.png'} alt={`${candidate.name || 'Candidate'} GitHub Avatar`} width={96} height={96} className="rounded-full object-cover border-2 border-gray-300" />
                      <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm w-full text-center flex items-center justify-center space-x-2 hover:bg-gray-700 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.477-1.11-1.477-.908-.62.069-.608.069-.608 1.004.072 1.531 1.032 1.531 1.032.892 1.529 2.341 1.089 2.91.832.092-.647.35-1.089.636-1.339-2.22-.253-4.555-1.119-4.555-4.976 0-1.109.376-2.019 1.03-2.723-.104-.254-.447-1.292.097-2.691 0 0 .84-.272 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.7.111 2.5.305 1.902-1.298 2.747-1.026 2.747-1.026.546 1.399.203 2.437.096 2.691.654.704 1.03 1.614 1.03 2.723 0 3.867-2.334 4.722-4.56 4.976.354.305.678.915.678 1.846 0 1.334-.012 2.41-.012 2.727 0 .266.18.593.687.485C21.133 20.2 24 16.435 24 12.017 24 6.484 19.522 2 12 2z"/></svg>
                        <span>GitHub 主页</span>
                      </a>
                    </div>
                    <div className="flex-grow space-y-3 text-gray-800 w-full">
                      <h2 className="text-2xl font-bold text-gray-800">{candidate.name || 'N/A'}</h2>
                      <p className="text-gray-600"><strong>邮箱:</strong> {candidate.email || '未提供'}</p>
                      {candidate.website && (<p className="text-gray-600 truncate"><strong>网站:</strong> <a href={candidate.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{candidate.website.replace(/(^\w+:|^)\/\//, '')}</a></p>)}
                      <p className="text-gray-600"><strong>公司:</strong> {candidate.company || '未提供'}</p>
                      <p className="text-gray-600"><strong>地址:</strong> {candidate.location || '未提供'}</p>
                      <div>
                        <strong className="text-gray-600">技术标签:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {candidate.skills && candidate.skills.length > 0 ? (candidate.skills.map((skill, index) => (<span key={index} className="bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>))) : (<span className="text-sm text-gray-500">无</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <nav className="flex justify-center mt-10 space-x-4">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className={`${LOGO_BLUE_COLOR_CLASS} text-white px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}>上一页</button>
              <span className="text-gray-700 text-lg font-semibold flex items-center px-4">{currentPage} / {totalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} className={`${LOGO_BLUE_COLOR_CLASS} text-white px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}>下一页</button>
            </nav>
          )}
        </main>
      )}
    </div>
  );
};

export default HomePage;
