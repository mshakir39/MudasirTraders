/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    domains: ['res.cloudinary.com'],
    // formats: ['image/webp', 'image/avif'], // Temporarily disabled
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // React 19: Fix memory leak warnings and exclude MongoDB from client
  serverExternalPackages: ['mongodb', 'bson'],

  // Webpack optimizations for better performance
  webpack: (config, { dev, isServer }) => {
    // Simple fix: disable inline for all assets
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
    });

    if (!dev && !isServer) {
      // Production optimizations for client-side only
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // React 19: Development server optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };

      // Increase max listeners for development
      config.target = 'node';
      config.node = {
        ...config.node,
        __dirname: true,
      };
    }

    // Optimizations for both dev and prod
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Optimize imports
        '@components': './src/components',
        '@utils': './src/utils',
        '@actions': './src/actions',
        '@getData': './src/getData',
        '@interfaces': './src/interfaces',
        '@app': './src/app',
        '@libs': './src/app/libs',
      },
    };

    return config;
  },

  // Optimize bundle analyzer and experimental features
  experimental: {
    caseSensitiveRoutes: false,
    optimizePackageImports: [
      'react',
      'react-dom',
      'react-icons',
      'date-fns',
      'lodash',
      '@headlessui/react',
    ],
    scrollRestoration: true,
  },

  // Ensure API routes are properly handled
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      // Cache static assets
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache font files with proper headers
      {
        source: '/static/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Optimize output (commented out for Vercel compatibility)
  // output: 'standalone',

  // Vercel-specific optimizations
  trailingSlash: false,
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Power headers for caching
  poweredByHeader: false,

  // Optimize CSS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable source maps for production debugging
  productionBrowserSourceMaps: true,
};

export default nextConfig;
