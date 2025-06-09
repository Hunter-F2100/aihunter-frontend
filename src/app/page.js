// 声明为客户端组件，因为我们使用了 React Hooks (useState, useEffect)
'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// --- 主页面组件 ---
const HomePage = () => {
  // --- 状态管理 (State Management) ---
  const [searchText, setSearchText] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // 用于跟踪是否是首次加载，以显示初始欢迎信息
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // --- 常量定义 (Constants) ---
  const itemsPerPage = 10; // 确保与后端分页设置一致
  const companyLogoPath = '/HLG-logo.png';
  const logoBlueColorClass = 'bg-blue-600 hover:bg-blue-700';

  // --- 核心搜索函数 (Core Search Function) ---
  const performSearch = async (page = 1) => {
    // 验证输入是否为空
    if (!searchText.trim()) {
      setError('请输入有效的搜索关键词。');
      setCandidates([]);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    setError(null);
    setIsInitialLoad(false); // 用户已执行过搜索，不再是初始加载状态

    // 【已修复】使用正确的模板字符串语法构建后端 API URL
    const backendUrl = "https://aihunter-backend.onrender.com/search?q=" + searchText + "&page=" + page;

    try {
      const response = await fetch(backendUrl);
      if (!response.ok) {
        // 如果网络响应不成功，尝试解析后端返回的错误信息
        const errorData = await response.json().catch(() => ({ message: '无法解析错误信息。' }));
        throw new Error(errorData.message || `请求失败，状态码: ${response.status}`);
      }
      const data = await response.json();
      setCandidates(data.candidates || []);
      setTotalPages(Math.ceil((data.total_count || 0) / itemsPerPage));
      setCurrentPage(page);

    } catch (err) {
      console.error("搜索请求失败:", err);
      setError(`搜索失败: ${err.message || "未知错误，请检查后端服务是否正常运行。"}`);
      setCandidates([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // --- 事件处理器 (Event Handlers) ---
  const handleSearchClick = () => {
    performSearch(1); // 每次点击搜索按钮，都从第一页开始
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      performSearch(newPage);
    }
  };

  // --- 渲染 (Render) ---
  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-4 sm:p-8 pt-12 sm:pt-16">
      {/* 顶部区域: Logo 和标题 */}
      <header className="w-full max-w-4xl flex items-center justify-center mb-8">
        <div className="flex items-center">
          {companyLogoPath && (
            <Image
              src={companyLogoPath}
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

      {/* 搜索区域 */}
      <div className="w-full max-w-xl flex items-center space-x-3">
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
          className={`${logoBlueColorClass} text-white px-8 py-4 rounded-xl shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-opacity-60 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </div>

      {/* 结果显示区域 */}
      <main className="w-full max-w-4xl mt-10">
        {/* 状态提示信息 */}
        {loading && <p className="text-center text-gray-600 mt-12 text-lg">正在加载候选人...</p>}
        {error && <p className="text-center text-red-600 mt-12 text-lg font-medium">{error}</p>}
        {isInitialLoad && !loading && !error && (
          <p className="text-center text-gray-500 mt-12">请输入关键词，点击“搜索”按钮。</p>
        )}
        {!loading && !isInitialLoad && candidates.length === 0 && !error && (
          <p className="text-center text-gray-500 mt-12">没有找到符合条件的候选人。</p>
        )}

        {/* 候选人卡片列表 */}
        {!loading && candidates.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {candidates.map((candidate) => (
              // 【改动 1】: 将 md:items-start 改为 md:items-center，实现垂直居中
              <div key={candidate.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                {/* 左侧: 头像和 GitHub 按钮 */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-4 w-full md:w-36">
                  <Image
                    src={candidate.githubAvatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-gray-400"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.477-1.11-1.477-.908-.62.069-.608.09-0.608 1.004.072 1.531 1.032 1.531 1.032.892 1.529 2.341 1.089 2.91.832.092-.647.35-1.089.636-1.339-2.22-.253-4.555-1.119-4.555-4.976 0-1.109.376-2.019 1.03-2.723-.104-.254-.447-1.292.097-2.691 0 0 .84-.272 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.7.111 2.5.305 1.902-1.298 2.747-1.026 2.747-1.026.546 1.399.203 2.437.096 2.691.654.704 1.03 1.614 1.03 2.723 0 3.867-2.334 4.722-4.56 4.976.354.305.678.915.678 1.846 0 1.334-.012 2.41-.012 2.727 0 .266.18.593.687.485C21.133 20.2 24 16.435 24 12.017 24 6.484 19.522 2 12 2z" clip-rule="evenodd" /></svg>'}
                    alt={`${candidate.name || 'Candidate'} GitHub Avatar`}
                    width={96}
                    height={96}
                    className="rounded-full object-cover border-2 border-gray-300"
                  />
                  <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm w-full text-center flex items-center justify-center space-x-2 hover:bg-gray-700 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.477-1.11-1.477-.908-.62.069-.608.069-.608 1.004.072 1.531 1.032 1.531 1.032.892 1.529 2.341 1.089 2.91.832.092-.647.35-1.089.636-1.339-2.22-.253-4.555-1.119-4.555-4.976 0-1.109.376-2.019 1.03-2.723-.104-.254-.447-1.292.097-2.691 0 0 .84-.272 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.7.111 2.5.305 1.902-1.298 2.747-1.026 2.747-1.026.546 1.399.203 2.437.096 2.691.654.704 1.03 1.614 1.03 2.723 0 3.867-2.334 4.722-4.56 4.976.354.305.678.915.678 1.846 0 1.334-.012 2.41-.012 2.727 0 .266.18.593.687.485C21.133 20.2 24 16.435 24 12.017 24 6.484 19.522 2 12 2z" />
                    </svg>
                    <span>GitHub 主页</span>
                  </a>
                </div>

                {/* 右侧: 详细信息 */}
                <div className="flex-grow space-y-3 text-gray-800 w-full">
                  {/* 【改动 2】: 移除了 text-blue-700，使其继承父元素的深灰色 */}
                  <h2 className="text-2xl font-bold">{candidate.name || 'N/A'}</h2>
                  <p className="text-gray-600"><strong>邮箱:</strong> {candidate.email || '未提供'}</p>
                  {candidate.website && (
                    <p className="text-gray-600 truncate"><strong>网站:</strong> <a href={candidate.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{candidate.website.replace(/(^\w+:|^)\/\//, '')}</a></p>
                  )}
                  <p className="text-gray-600"><strong>公司:</strong> {candidate.company || '未提供'}</p>
                  <p className="text-gray-600"><strong>地址:</strong> {candidate.location || '未提供'}</p>
                  <div>
                    <strong className="text-gray-600">技术标签:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {candidate.skills && candidate.skills.length > 0 ? (
                        candidate.skills.map((skill, index) => (
                          <span key={index} className="bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">无</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 分页导航 */}
      {totalPages > 1 && (
        <nav className="flex justify-center mt-10 space-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className={`${logoBlueColorClass} text-white px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            上一页
          </button>
          <span className="text-gray-700 text-lg font-semibold flex items-center px-4">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className={`${logoBlueColorClass} text-white px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            下一页
          </button>
        </nav>
      )}

    </div>
  );
};

export default HomePage;