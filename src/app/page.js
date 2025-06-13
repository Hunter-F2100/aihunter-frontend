'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
// [修复] 导入我们新安装的"Markdown翻译官"和它的增强插件
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// [修复] 个人简介弹窗组件 - 修复 className 报错问题
const ProfileModal = ({ candidate, onClose }) => {
  // 使用 useEffect 来处理键盘事件，比如按 Esc键 关闭弹窗
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    // 组件卸载时，移除事件监听器，避免内存泄漏
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    // 这是整个模态框的容器，一个半透明的黑色背景，覆盖整个屏幕
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50 transition-opacity duration-300"
      onClick={onClose} // 点击背景也可以关闭弹窗
    >
      {/* 这是弹窗的主体内容部分，我们阻止它响应背景的点击事件 */}
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* 弹窗头部 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">{candidate.name || candidate.login} 的个人简介</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        {/* 弹窗内容 (可滚动) */}
        <div className="p-6 overflow-y-auto">
          {/* [核心修复] 用 div 包裹 ReactMarkdown，避免 className 报错 */}
          <div className="prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]} // 启用 GFM (表格, 删除线等GitHub特色语法)
              components={{
                  // [智能优化] 重写 a 标签和 img 标签的行为
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />,
                  img: ({node, ...props}) => <img {...props} style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} alt="" />
              }}
            >
              {candidate.profile_readme || ''}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};


// 主搜索组件 - 包含所有搜索逻辑和 UI
const MainSearchComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // --- 登录表单状态 (您的原始代码，保持不变) ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- 搜索功能状态 (您的原始代码，保持不变) ---
  const [searchText, setSearchText] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // [新增功能] 用于控制弹窗的状态
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // --- 常量定义 (您的原始代码，保持不变) ---
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  const ITEMS_PER_PAGE = 10;
  const COMPANY_LOGO_PATH = '/HLG-logo.png';
  const LOGO_BLUE_COLOR_CLASS = 'bg-blue-600 hover:bg-blue-700';

  // --- 认证及其他函数 (您的原始代码，保持不变) ---
  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setLoginError('用户名或密码错误，请重试。');
      } else {
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
    router.push('/');
    signOut({ callbackUrl: '/' });
  };
  
  const performSearch = async (query, page) => {
    if (!query) return;
    setLoading(true);
    setSearchError(null);
    setIsInitialLoad(false);
    const backendUrl = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`;
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

  useEffect(() => {
    if (status === 'authenticated') {
      const queryFromUrl = searchParams.get('q');
      const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
      setSearchText(queryFromUrl || '');
      if (queryFromUrl) {
        performSearch(queryFromUrl, pageFromUrl);
      } else {
        setCandidates([]);
        setTotalPages(0);
        setCurrentPage(1);
        setIsInitialLoad(true);
        setSearchError(null);
      }
    }
  }, [searchParams, status]);

  const handleSearchClick = () => {
    if (!session) {
      setLoginError("请先登录才能进行搜索。");
      return;
    }
    if (!searchText.trim()) {
      setSearchError('请输入有效的搜索关键词。');
      return;
    }
    router.push(`/?q=${encodeURIComponent(searchText)}&page=1`);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') handleSearchClick();
  };

  const handlePageChange = (newPage) => {
    const currentQuery = searchParams.get('q');
    if (currentQuery && !loading) {
      router.push(`/?q=${encodeURIComponent(currentQuery)}&page=${newPage}`);
    }
  };

  // --- 渲染逻辑 ---

  // 会话加载提示 (您的原始代码，保持不变)
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white">
        <p className="text-gray-500 text-xl font-semibold">会话加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4 sm:p-8 pt-16 sm:pt-20">
      
      {/* 顶部区域 (您的原始代码，保持不变) */}
      <header className="w-full max-w-4xl flex items-center justify-center mb-10">
        <div className="flex items-center">
          {COMPANY_LOGO_PATH && (
            <Image
              src={COMPANY_LOGO_PATH}
              alt="HLG Logo"
              width={90}
              height={90}
              className="mr-4"
              priority
            />
          )}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">猎头搜索工具</h1>
        </div>
      </header>

      {/* 登录表单 (您的原始代码，保持不变) */}
      {status === 'unauthenticated' ? (
        <main className="w-full max-w-sm">
          <form onSubmit={handleLoginSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">请登录</h2>
            {loginError && <p className="text-red-500 text-xs italic text-center mb-4">{loginError}</p>}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">用户名</label>
              <input 
                id="username" 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                placeholder="Username" 
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">密码</label>
              <input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
                placeholder="******************" 
              />
            </div>
            <div className="flex items-center justify-between">
              <button 
                type="submit" 
                disabled={isLoggingIn} 
                className={`${LOGO_BLUE_COLOR_CLASS} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50`}
              >
                {isLoggingIn ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
        </main>
      ) : (
        <main className="w-full max-w-5xl">
          {/* 用户信息和搜索区域 (您的原始代码，保持不变) */}
          <div className="flex justify-between items-center mb-6 px-2">
            <p className="text-gray-600">欢迎, <span className="font-semibold">{session?.user?.name || session?.user?.email || session?.user?.username}</span>!</p>
            <button 
              onClick={handleLogout} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors duration-200"
            >
              退出
            </button>
          </div>
          <div className="w-full max-w-xl flex items-center space-x-3 mx-auto">
            <input 
              type="text" 
              placeholder="请输入英文关键词..." 
              value={searchText} 
              onChange={(e) => setSearchText(e.target.value)} 
              onKeyPress={handleKeyPress} 
              className="flex-grow p-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-transparent text-lg text-gray-700 placeholder-gray-400" 
            />
            <button 
              onClick={handleSearchClick} 
              disabled={loading} 
              className={`${LOGO_BLUE_COLOR_CLASS} text-white px-8 py-4 rounded-xl shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-opacity-60 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>

          {/* 结果显示区域 */}
          <div className="mt-10">
            {/* 加载和错误提示 (您的原始代码，保持不变) */}
            {loading && <p className="text-center text-gray-600 mt-12 text-lg">正在加载候选人...</p>}
            {searchError && <p className="text-center text-red-600 mt-12 text-lg font-medium">{searchError}</p>}
            {isInitialLoad && !loading && !searchError && <p className="text-center text-gray-500 mt-12">请输入关键词，开始搜索。</p>}
            {!loading && !isInitialLoad && candidates.length === 0 && !searchError && <p className="text-center text-gray-500 mt-12">没有找到符合条件的候选人。</p>}
            
            {/* ====================================================================== */}
            {/* === 核心替换区域：使用我们最终确认的、完美的卡片样式进行渲染 === */}
            {/* ====================================================================== */}
            {!loading && candidates.length > 0 && (
              <div className="space-y-6"> {/* 使用 space-y 来控制卡片间的垂直间距 */}
                {candidates.map((candidate) => (
                  <div 
                    key={candidate.id} 
                    className="flex items-center bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out max-w-[960px] mx-auto border border-gray-200 p-6 md:p-8 hover:-translate-y-1"
                  >
                    {/* 左侧区域：头像和GitHub按钮 */}
                    <div className="flex flex-col items-center justify-center flex-shrink-0 mr-8 w-[140px]">
                      <Image 
                        src={candidate.githubAvatar || '/default-avatar.png'} 
                        alt={`${candidate.name || 'Candidate'} GitHub Avatar`} 
                        width={96} 
                        height={96} 
                        className="rounded-full object-cover border-2 border-gray-100 mb-4" 
                      />
                      <a 
                        href={candidate.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.477-1.11-1.477-.908-.62.069-.608.069-.608 1.004.072 1.531 1.032 1.531 1.032.892 1.529 2.341 1.089 2.91.832.092-.647.35-1.089.636-1.339-2.22-.253-4.555-1.119-4.555-4.976 0-1.109.376-2.019 1.03-2.723-.104-.254-.447-1.292.097-2.691 0 0 .84-.272 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.7.111 2.5.305 1.902-1.298 2.747-1.026 2.747-1.026.546 1.399.203 2.437.096 2.691.654.704 1.03 1.614 1.03 2.723 0 3.867-2.334 4.722-4.56 4.976.354.305.678.915.678 1.846 0 1.334-.012 2.41-.012 2.727 0 .266.18.593.687.485C21.133 20.2 24 16.435 24 12.017 24 6.484 19.522 2 12 2z"/></svg>
                        <span>GitHub主页</span>
                      </a>
                    </div>

                    {/* 右侧区域：详细信息 */}
                    <div className="flex-1 text-sm">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{candidate.name || 'N/A'}</h2>
                      
                      <p className="text-gray-600 my-1">
                        <strong className="font-semibold text-gray-700">邮箱:</strong> {candidate.email || '未提供'}
                      </p>

                      {candidate.website && (
                        <p className="text-gray-600 truncate my-1">
                          <strong className="font-semibold text-gray-700">网站:</strong> 
                          <a 
                            href={candidate.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline ml-1"
                          >
                            {candidate.website.replace(/(^\w+:|^)\/\//, '')}
                          </a>
                        </p>
                      )}
                      
                      <p className="text-gray-600 my-1">
                        <strong className="font-semibold text-gray-700">公司:</strong> {candidate.company || '未提供'}
                      </p>
                      <p className="text-gray-600 my-1">
                        <strong className="font-semibold text-gray-700">地址:</strong> {candidate.location || '未提供'}
                      </p>
                      
                      {/* 技术标签 */}
                      <div className="my-3">
                        <strong className="font-semibold text-gray-700">技术标签:</strong>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {candidate.skills && candidate.skills.length > 0 ? (
                            candidate.skills.map((skill, index) => (
                              <span key={index} className="bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">无</span>
                          )}
                        </div>
                      </div>

                      <hr className="my-3 border-gray-100" />
                      
                      {/* 个人简介 */}
                      <div>
                        <strong className="font-semibold text-gray-700">个人简介:</strong>
                        {candidate.profile_readme ? (
                          <>
                            <p className="text-gray-500 mt-1 text-sm leading-relaxed max-h-20 overflow-hidden">
                              {candidate.profile_readme.substring(0, 150)}{candidate.profile_readme.length > 150 ? '...' : ''}
                            </p>
                            <button 
                              onClick={() => setSelectedCandidate(candidate)} 
                              className="text-blue-600 hover:text-blue-800 font-semibold text-sm mt-1 self-start"
                            >
                              展开详情 &rarr;
                            </button>
                          </>
                        ) : (
                          <p className="text-gray-400 italic mt-1 text-sm">暂无个人简介。</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 分页导航 (您的原始代码，保持不变) */}
            {totalPages > 1 && (
              <nav className="flex justify-center mt-10 space-x-4">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1 || loading} 
                  className={`${LOGO_BLUE_COLOR_CLASS} text-white px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  上一页
                </button>
                <span className="text-gray-700 text-lg font-semibold flex items-center px-4">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages || loading} 
                  className={`${LOGO_BLUE_COLOR_CLASS} text-white px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  下一页
                </button>
              </nav>
            )}
          </div>
        </main>
      )}

      {/* [新增功能] 在这里渲染弹窗组件 */}
      {selectedCandidate && (
        <ProfileModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
};

// 主页面组件 (您的原始代码，保持不变)
const HomePage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center bg-white">
        <p className="text-gray-500 text-xl font-semibold">页面加载中，请稍候...</p>
      </div>
    }>
      <MainSearchComponent />
    </Suspense>
  );
};

export default HomePage;
