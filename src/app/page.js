// 如果您使用的是 App Router (即文件在 `app/` 目录下)，请在文件顶部添加这一行：
'use client'; 

import React, { useState, useEffect } from 'react'; // 引入 useEffect 用于初始化搜索
import Image from 'next/image'; // 引入 Next.js 的 Image 组件来优化图片加载

const HomePage = () => {
  // 用于存储搜索框输入的文本
  const [searchText, setSearchText] = useState('');

  // 模拟的候选人数据，未来会从后端获取
  const mockCandidates = [
    {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      website: 'https://www.linkedin.com/in/zhangsan',
      company: '科技创新公司',
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
      location: '北京, 中国',
      githubUrl: 'https://github.com/zhangsan',
      githubAvatar: 'https://avatars.githubusercontent.com/u/1?v=4', // GitHub 默认头像，未来替换
    },
    {
      id: 2,
      name: '李四',
      email: 'lisi@example.com',
      website: 'https://www.linkedin.com/in/lisi',
      company: '人工智能研究院',
      skills: ['Python', 'Machine Learning', 'Data Science'],
      location: '上海, 中国',
      githubUrl: 'https://github.com/lisi',
      githubAvatar: 'https://avatars.githubusercontent.com/u/2?v=4', // GitHub 默认头像，未来替换
    },
    {
      id: 3,
      name: '王五',
      email: 'wangwu@example.com',
      website: 'https://www.linkedin.com/in/wangwu',
      company: '金融科技公司',
      skills: ['Java', 'Spring Boot', 'Kafka'],
      location: '深圳, 中国',
      githubUrl: 'https://github.com/wangwu',
      githubAvatar: 'https://avatars.githubusercontent.com/u/3?v=4', // GitHub 默认头像，未来替换
    },
    {
      id: 4,
      name: '赵六',
      email: 'zhaoliu@example.com',
      website: 'https://www.linkedin.com/in/zhaoliu',
      company: '数据分析机构',
      skills: ['R', 'SQL', '统计学'],
      location: '广州, 中国',
      githubUrl: 'https://github.com/zhaoliu',
      githubAvatar: 'https://avatars.githubusercontent.com/u/4?v=4',
    },
    {
      id: 5,
      name: '孙七',
      email: 'sunqi@example.com',
      website: 'https://www.linkedin.com/in/sunqi',
      company: '移动互联网公司',
      skills: ['Swift', 'Kotlin', 'iOS', 'Android'],
      location: '杭州, 中国',
      githubUrl: 'https://github.com/sunqi',
      githubAvatar: 'https://avatars.githubusercontent.com/u/5?v=4',
    },
    {
      id: 6,
      name: '周八',
      email: 'zhouba@example.com',
      website: 'https://www.linkedin.com/in/zhouba',
      company: '云计算服务商',
      skills: ['Golang', 'Docker', 'Kubernetes'],
      location: '成都, 中国',
      githubUrl: 'https://github.com/zhouba',
      githubAvatar: 'https://avatars.githubusercontent.com/u/6?v=4',
    },
    {
      id: 7,
      name: '吴九',
      email: 'wujiu@example.com',
      website: 'https://www.linkedin.com/in/wujiu',
      company: '游戏开发公司',
      skills: ['C++', 'Unreal Engine', 'Unity'],
      location: '武汉, 中国',
      githubUrl: 'https://github.com/wujiu',
      githubAvatar: 'https://avatars.githubusercontent.com/u/7?v=4',
    },
    {
      id: 8,
      name: '郑十',
      email: 'zhengshi@example.com',
      website: 'https://www.linkedin.com/in/zhengshi',
      company: '电子商务平台',
      skills: ['PHP', 'Laravel', 'Vue.js'],
      location: '南京, 中国',
      githubUrl: 'https://github.com/zhengshi',
      githubAvatar: 'https://avatars.githubusercontent.com/u/8?v=4',
    },
    {
      id: 9,
      name: '冯一',
      email: 'fengyi@example.com',
      website: 'https://www.linkedin.com/in/fengyi',
      company: '物联网解决方案',
      skills: ['Embedded Systems', 'C', 'Python'],
      location: '西安, 中国',
      githubUrl: 'https://github.com/fengyi',
      githubAvatar: 'https://avatars.githubusercontent.com/u/9?v=4',
    },
    {
      id: 10,
      name: '陈二',
      email: 'chener@example.com',
      website: 'https://www.linkedin.com/in/chener',
      company: '网络安全公司',
      skills: ['Cybersecurity', 'Linux', 'Networking'],
      location: '重庆, 中国',
      githubUrl: 'https://github.com/chener',
      githubAvatar: 'https://avatars.githubusercontent.com/u/10?v=4',
    },
    {
      id: 11,
      name: '褚三',
      email: 'chusan@example.com',
      website: 'https://www.linkedin.com/in/chusan',
      company: 'SaaS 企业服务',
      skills: ['Ruby on Rails', 'PostgreSQL', 'AWS'],
      location: '苏州, 中国',
      githubUrl: 'https://github.com/chusan',
      githubAvatar: 'https://avatars.githubusercontent.com/u/11?v=4',
    },
  ];

  // 用于存储搜索结果的候选人列表 (当前页显示的数据)
  const [candidates, setCandidates] = useState([]); // 初始时，结果列表是空的

  // 分页相关的状态
  const [currentPage, setCurrentPage] = useState(1); // 当前页码，默认第一页
  const itemsPerPage = 10; // 每页显示10个候选人
  const [totalPages, setTotalPages] = useState(0); // 总页数，初始为0

  // 您的公司 Logo 图片路径
  const companyLogoPath = '/HLG-logo.png'; 

  // 按钮的蓝色，这里使用 Tailwind CSS 提供的一个蓝色，并稍微加深了一点
  const logoBlueColorClass = 'bg-blue-600 hover:bg-blue-700';

  // 用于执行搜索和更新分页数据的函数
  const performSearch = (page = 1) => { // 默认搜索第一页
    console.log(`执行搜索，关键词：${searchText}，第 ${page} 页`);

    // 假设 mockCandidates 是所有数据，真实项目中这里会调用后端 API
    const totalItems = mockCandidates.length;
    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
    setTotalPages(calculatedTotalPages);
    setCurrentPage(page); // 更新当前页码

    // 根据当前页码和每页数量，截取当前页的模拟数据
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const candidatesToShow = mockCandidates.slice(startIndex, endIndex);

    setCandidates(candidatesToShow); // 更新当前页显示的候选人
  };

  // 点击搜索按钮时会运行这个函数
  const handleSearch = () => {
    performSearch(1); // 点击搜索按钮时，总是从第一页开始搜索
  };

  // 处理分页按钮点击事件
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      performSearch(newPage); // 执行新页的搜索
    }
  };

  // 组件第一次加载时，自动执行一次搜索（显示第一页数据）
  useEffect(() => {
    performSearch(1); // 页面加载后自动显示第一页数据
  }, []); // [] 表示只在组件挂载时执行一次


  return (
    // 整个页面的外层容器，设置最小高度，居中内容，并设置背景色和内边距
    // 页面内容整体靠上，而不是垂直居中，背景色为纯白
    <div className="min-h-screen flex flex-col items-center bg-white p-4 pt-20">
      {/* 公司 Logo 和标题的区域 */}
      <div className="flex items-center mb-8">
        {companyLogoPath && (
          <Image
            src={companyLogoPath}
            alt="HLG Logo"
            width={90} // Logo 宽度
            height={90} // Logo 高度
            className="mr-3" // Logo 右边距
            priority
          />
        )}
        <h1 className="text-5xl font-extrabold text-gray-900">猎头搜索工具</h1>
      </div>

      {/* 搜索框和搜索按钮的区域 */}
      <div className="w-full max-w-md flex items-center space-x-3">
        {/* 搜索输入框 */}
        <input
          type="text"
          placeholder="请输入英文关键词..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-grow p-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-transparent text-lg text-gray-700 placeholder-gray-400"
        />
        {/* 搜索按钮 */}
        <button
          onClick={handleSearch}
          className={`${logoBlueColorClass} text-white px-8 py-4 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-opacity-60 text-lg font-semibold`}
        >
          搜索
        </button>
      </div>

      {/* 候选人搜索结果容器 */}
      {candidates.length > 0 ? ( // 只有当有候选人数据时才显示卡片
        <div className="w-full max-w-4xl mt-12 grid grid-cols-1 gap-6">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-8 border border-gray-200">
              {/* 左侧：GitHub 头像和主页按钮 */}
              <div className="flex flex-col items-center space-y-3 pr-4">
                {/* GitHub 头像 */}
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm overflow-hidden">
                  <Image
                    src={candidate.githubAvatar} // 使用模拟数据中的 GitHub 头像 URL
                    alt={`${candidate.name} GitHub Avatar`}
                    width={96} // 头像尺寸
                    height={96}
                    className="rounded-full object-cover" // 使图片填充圆形区域
                  />
                </div>
                {/* GitHub 主页按钮 */}
                <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-gray-700 transition-colors duration-200">
                  {/* GitHub 小猫图标 SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.477-1.11-1.477-.908-.62.069-.608.069-.608 1.004.072 1.531 1.032 1.531 1.032.892 1.529 2.341 1.089 2.91.832.092-.647.35-1.089.636-1.339-2.22-.253-4.555-1.119-4.555-4.976 0-1.109.376-2.019 1.03-2.723-.104-.254-.447-1.292.097-2.691 0 0 .84-.272 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.7.111 2.5.305 1.902-1.298 2.747-1.026 2.747-1.026.546 1.399.203 2.437.096 2.691.654.704 1.03 1.614 1.03 2.723 0 3.867-2.334 4.722-4.56 4.976.354.305.678.915.678 1.846 0 1.334-.012 2.41-.012 2.727 0 .266.18.593.687.485C21.133 20.2 24 16.435 24 12.017 24 6.484 19.522 2 14 2h-2z" clipRule="evenodd" />
                  </svg>
                  <span>GitHub 主页</span>
                </a>
              </div>

              {/* 右侧：候选人信息 */}
              <div className="flex-grow space-y-2 text-gray-800">
                <h2 className="text-xl font-semibold">{candidate.name}</h2>
                <p className="text-gray-600">邮箱：{candidate.email}</p>
                {candidate.website && ( // 只有当有个人网站时才显示
                  <p className="text-gray-600">个人网站：<a href={candidate.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{candidate.website.replace(/(^\w+:|^)\/\//, '')}</a></p>
                )}
                <p className="text-gray-600">公司：{candidate.company}</p>
                <p className="text-gray-600">
                  技术标签：
                  {candidate.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2 mb-1 inline-block">
                      {skill}
                    </span>
                  ))}
                </p>
                <p className="text-gray-600">地址：{candidate.location}</p>
              </div>
            </div>
          ))}
        </div>
      ) : ( // <-- 我这次就是在这里删除了一个多余的括号
          // 如果没有候选人数据，或者在搜索前，显示一个提示
          <p className="text-center text-gray-500">点击“搜索”按钮，查看候选人列表。</p>
        )}
      {/* 分页导航按钮 */}
      {totalPages > 1 && ( // 只有当总页数大于1时才显示分页按钮
        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)} // 点击上一页
            disabled={currentPage === 1} // 第一页时禁用
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-gray-700 text-lg font-semibold flex items-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)} // 点击下一页
            disabled={currentPage === totalPages} // 最后一页时禁用
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
      
      {/* 页面底部可以放置一些额外内容或占位符 */}
      <div className="mt-12 text-gray-500 text-sm">
        <p>提供基于AI的专业猎头搜索服务</p>
      </div>
    </div>
  );
};

export default HomePage;