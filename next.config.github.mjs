const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Исключаем API routes для статического экспорта
  experimental: {
    appDir: true
  }
};

export default nextConfig;