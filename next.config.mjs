const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  }
};

export default nextConfig;
