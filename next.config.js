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
}
