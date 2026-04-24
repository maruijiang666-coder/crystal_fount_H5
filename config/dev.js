module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    // 本地 Docker 后端
    API_BASE_URL: '"http://6.6.6.123:8011"'
  },
  mini: {},
  h5: {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://6.6.6.123:8011',
          changeOrigin: true
        }
      }
    }
  }
}
