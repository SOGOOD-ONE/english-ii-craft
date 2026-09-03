/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES_DEPLOY === '1';

const nextConfig = {
  reactStrictMode: true,
  // GitHub Pages 部署时启用静态导出;常规 next dev/build 保持动态 SSR,不影响本地开发。
  output: isGithubPages ? 'export' : undefined,
  // GitHub Pages 项目级仓库(非 <org>.github.io)必须设置 basePath
  basePath: isGithubPages ? '/english-ii-craft' : '',
  assetPrefix: isGithubPages ? '/english-ii-craft/' : undefined,
  images: {
    // 静态导出不支持 Next.js image optimizer
    unoptimized: isGithubPages || process.env.NEXT_EXPORT === '1',
  },
  // 生产环境去除多余 source maps,减小 Pages 产物
  productionBrowserSourceMaps: false,
  trailingSlash: isGithubPages, // 静态导出时 a/b 目录 + index.html 访问格式
};

export default nextConfig;
