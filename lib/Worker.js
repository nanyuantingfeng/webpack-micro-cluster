/***************************************************
 * Created by nanyuantingfeng on 2019-07-18 18:54. *
 ***************************************************/
const InjectPlugin = require('webpack-inject-plugin').default
const exitHook = require('async-exit-hook')
const WorkerEvents = require('./WorkerEvents')
const isDevServerRunning = require('./helpers/is-webpack-dev-server-running')
const defaultGlobalObject = require('./helpers/default-global-object')

const PLUGIN_NAME = 'WebpackMicroClusterWorkerPlugin'

module.exports = class WorkerPlugin {
  constructor(options) {
    this.options = Object.assign({ entry: 'index' }, options)
  }

  apply(compiler) {
    // handle __webpack_public_path__
    const publicPath = compiler.options.output.publicPath
    const globalObject = compiler.options.output.globalObject || defaultGlobalObject

    // both `__webpack_public_path__` and `publicPath` begin and end with '/'
    // so fix  '//' -> '/'
    let injectedContent = `__webpack_public_path__=(${globalObject}['__webpack_public_path__'] + '///${publicPath}').replace(/[/]{3,}/g, "/");`

    // determine the current running environment
    if (isDevServerRunning()) {
      if (!compiler.options.devServer) {
        /**
         * must be set `devServer` node at webpack.config.js
         * because if not, this node will be `undefined` while running
         * if the node has be created, even if the registered value of the node
         * is an empty object, it will be filled with the correct value during the runtime
         * I think it`s defect of webpack or webpack-dev-server.
         * https://github.com/webpack/webpack-dev-server/issues/2442
         */
        throw new Error(`Please set 'devServer' node at webpack.config.js
        if you use cli set webpack-dev-server options,you also need set 'devServer' node, just like :
                  module.exports = {
                    // ..... 
                    devServer : {} ,
                    // ..... 
                 }
        please check https://github.com/webpack/webpack-dev-server/issues/2442            
        `)
      }

      const { workerId, entry, masterId } = this.options
      const devServer = compiler.options.devServer
      const { port, host } = devServer

      // this is current worker expose file path.
      const __WPP__ = `http://${host}:${port}${devServer.publicPath || '/'}`
      const url = `${__WPP__}${entry}.js`
      injectedContent = `__webpack_public_path__='${__WPP__}'`

      // at `afterEmit` , send `UPDATE` event to Master node
      compiler.hooks.afterEmit.tap(PLUGIN_NAME, () => {
        const workerEvents = new WorkerEvents(workerId, masterId)
        const data = { url, workerId }

       // workerEvents.send({ command: 'UPDATE', data: data })

        // at `Ctrl + C` , send `CLOSE` event to Master node
        exitHook(() => {
          workerEvents.send({ command: 'CLOSE', data: data })
        })

        /**
         * if the Master node is`t successfully started before the current Worker node has be started,
         * a multicast message 'online' will be sent after the Master node has been started,
         * and the current Worker node should respond to an 'UPDATE' event to notify
         * the Master node to subscribe to the Worker node`s message.
         */
        workerEvents.on('online', () => {
          workerEvents.send({ command: 'UPDATE', data: data })
        })
      })
    }

    new InjectPlugin(() => injectedContent).apply(compiler)
  }
}
