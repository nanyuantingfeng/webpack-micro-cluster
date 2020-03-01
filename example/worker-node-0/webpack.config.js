/***************************************************
 * Created by nanyuantingfeng on 2020/3/1 17:53. *
 ***************************************************/
const path = require('path')
const Worker = require('../../').Worker

module.exports = {
  entry: {
    index: './index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    libraryTarget: 'assign',
    libraryExport: 'default',
    library: ['__WORKERS__', 'worker0']
  },
  devServer: {},
  plugins: [
    new Worker({
      masterId: 'demo',
      workerId: 'worker0'
    })
  ]
}
