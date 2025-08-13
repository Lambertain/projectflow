const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Исключаем динамические страницы для статического экспорта
  generateBuildId: async () => {
    return 'github-pages-build'
  },
  experimental: {
    appDir: true
  }
};

export default nextConfig;