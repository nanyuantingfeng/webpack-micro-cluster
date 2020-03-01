/***************************************************
 * Created by nanyuantingfeng on 2020/3/1 17:53. *
 ***************************************************/
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const Master = require('../..').Master

module.exports = {
  entry: {
    index: './index.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  module: {},

  plugins: [
    new HtmlWebpackPlugin(),
    new Master({
      masterId: 'demo',
      injected: `var __WORKERS__ = window.__WORKERS__ = window.__WORKERS__ || {};`
    })
  ]
}
