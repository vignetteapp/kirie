module.exports = {
  async rewrites() {
    return [
      {
        source: '/:path',
        destination: '/api/sharp',
      },
      {
        source: '/',
        destination: '/api/sharp',
      },
    ]
  },
  images: {
    domains: [
      'yuri.might-be-super.fun',
      'avatars.githubusercontent.com',
      'vignetteapp.org',
      'res.cloudinary.com',
      'user-images.githubusercontent.com',
    ],
  },
}
