/** @type {import('next').NextConfig} */
const nextConfig = {
  // Biến môi trường public — Vercel tự inject từ Project Settings > Environment Variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Tắt powered-by header
  poweredByHeader: false,

  // Bật standalone output cho Docker nếu cần sau này
  // output: 'standalone',

  // Cho phép ảnh từ domain ngoài (thêm nếu dùng next/image)
  images: {
    domains: [],
  },
}

module.exports = nextConfig