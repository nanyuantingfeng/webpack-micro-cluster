/***************************************************
 * Created by nanyuantingfeng on 2019-07-18 18:54. *
 ***************************************************/
const path = require('path')
const InjectPlugin = require('webpack-inject-plugin').default
const exitHook = require('async-exit-hook')
const WorkerEvents = require('./WorkerEvents')
const LocalConfig = require('./LocalConfig')
const isDevServerRunning = require('./helpers/is-webpack-dev-server-running')
const defaultGlobalObject = require('./helpers/default-global-object')

const PLUGIN_NAME = 'WebpackMicroClusterWorkerPlugin'

module.exports = class WorkerPlugin {
  constructor(options) {
    this.options = Object.assign({ entry: 'index' }, options)
    this.localConfig = new LocalConfig(options.masterId)
  }

  apply(compiler) {
    // handle __webpack_public_path__
    const publicPath = compiler.options.output.publicPath
    const globalObject = compiler.options.output.globalObject || defaultGlobalObject

    let injectedContent = `__webpack_public_path__=${globalObject}['__webpack_public_path__'] + '${publicPath}';`

    // determine the current running environment
    if (isDevServerRunning()) {
      if (!compiler.options.devServer) {
        throw new Error(`Please set 'devServer' node at webpack.config.js
        if you use cli set webpack-dev-server options,you also need set 'devServer' node, just like :
                  module.exports = {
                    // ..... 
                    devServer : {} ,
                    // ..... 
                 }   
        `)
      }

      const { workerId, entry } = this.options
      const devServer = compiler.options.devServer
      const { port, host } = devServer
      const url = path.join('http://' + host + ':' + port, devServer.publicPath, entry + '.js')
      injectedContent = `__webpack_public_path__='${url}'`

      const workerEvents = new WorkerEvents(this.localConfig.getPorts())
      const data = { url, workerId }

      compiler.hooks.afterEmit.tap(PLUGIN_NAME, () => {
        workerEvents.send({ command: 'UPDATE', data: data })
      })

      exitHook(() => {
        workerEvents.send({ command: 'CLOSE', data: data })
      })

      workerEvents.subscribe('online', () => {
        workerEvents.send({ command: 'UPDATE', data: data })
      })
    }

    new InjectPlugin(() => injectedContent).apply(compiler)
  }
}
