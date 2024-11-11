/*
 * @Author: Abel-Evan cheng651081312@foxmail.com
 * @Date: 2022-03-23 18:23:28
 * @LastEditors: chengch chengch@anystreaming.cn
 * @LastEditTime: 2023-05-17 12:29:06
 * @FilePath: /mediav2/vue.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { defineConfig } = require('@vue/cli-service')
const proxyconfig = {
  // target: 'https://192.168.1.20',
  // target: `https://dsp.anystreaming.cn`,
  // target: `https://video.kxwell.com`,
  target: `https://ssv.anystreaming.cn`,
  changeOrigin: true,
  ws: true
}
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  transpileDependencies: false,
  productionSourceMap: false,
  pages: {
    wxpage: {
      entry: 'src/wx/main.js',
      template: 'src/wx/index.html',
      filename: 'wxpage.html',
      title: '智能短视频',
      chunks: ['chunk-wx-vendors', 'chunk-wx-common', 'wxpage']
    },
  },
  configureWebpack: {
    resolve: {
      fallback: {
        "path": require.resolve("path-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        "util": require.resolve("util"),
        "stream": require.resolve("stream-browserify")
      }
    }
  },
  devServer: {
    port: 8093,
    proxy: {
      '/api': proxyconfig,
      '/media/storage': proxyconfig
    }
  }
})
