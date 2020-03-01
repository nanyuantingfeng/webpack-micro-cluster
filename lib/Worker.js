/***************************************************
 * Created by nanyuantingfeng on 2019-07-18 18:54. *
 ***************************************************/
const InjectPlugin = require('webpack-inject-plugin').default
const exitHook = require('async-exit-hook')
const WorkerEvents = require('./WorkerEvents')
const LocalConfig = require('./LocalConfig')
const isDevServerRunning = require('./helpers/is-webpack-dev-server-running')
const defaultGlobalObject = require('./helpers/default-global-object')

const PLUGIN_NAME = 'WebpackMicroClusterWorkerPlugin'

module.exports = class WorkerPlugin {
  constructor(options) {
    this.options = options
    this.localConfig = new LocalConfig(options.masterName)
  }

  apply(compiler) {
    const workerName = this.options.workerName

    // handle __webpack_public_path__
    const publicPath = compiler.options.output.publicPath
    const globalObject = compiler.options.output.globalObject || defaultGlobalObject

    let injectedContent = `__webpack_public_path__=${globalObject}['__webpack_public_path__'] + '${publicPath}';`

    // determine the current running environment
    if (isDevServerRunning()) {
      const devServer = compiler.options.devServer
      const { port, host } = devServer
      const url = 'http://' + host + ':' + port + devServer.publicPath
      injectedContent = `__webpack_public_path__='${url}'`

      const workerEvents = new WorkerEvents(this.localConfig.getPorts())
      const data = { url, port, host, workerName }

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
