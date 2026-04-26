module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    // 本地 Docker 后端
    API_BASE_URL: '"http://192.168.1.2:8011"'
  },
  mini: {},
  h5: {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://192.168.1.2:8011',
          changeOrigin: true
        }
      }
    }
  }
}
