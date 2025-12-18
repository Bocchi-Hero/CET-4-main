/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许在服务端使用环境变量
  env: {
    // 仅暴露非敏感变量给客户端
  },
  // 优化图片
  images: {
    domains: [],
  },
}

module.exports = nextConfig
