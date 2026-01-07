/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Evolution Lab removed; send old links home
      {
        source: '/evolution-lab',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig

