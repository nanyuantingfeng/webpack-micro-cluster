/***************************************************
 * Created by nanyuantingfeng on 2019-07-17 21:25. *
 ***************************************************/
const EventEmitter = require('events')
const path = require('path')
const fs = require('fs')
const ansicolors = require('ansi-colors')

const VirtualModulesPlugin = require('webpack-virtual-modules')
const InjectPlugin = require('webpack-inject-plugin').default

const MasterEvents = require('./MasterEvents')
const WorkerEntriesGenerator = require('./WorkerEntriesGenerator')
const logger = require('./helpers/logger')
const LocalConfig = require('./LocalConfig')
const isDevServerRunning = require('./helpers/is-webpack-dev-server-running')
const defaultGlobalObject = require('./helpers/default-global-object')

const PLUGIN_NAME = 'WebpackMicroClusterMasterPlugin'

module.exports = class MasterPlugin extends EventEmitter {
  constructor(options) {
    super()
    this.options = options
    this.localConfig = new LocalConfig(options.masterId)
  }

  /**
   * Watch workers events,
   * trigger recompiling at events UPDATE/CLOSE has been received
   */
  watch(compiler, virtualModules) {
    const workerEntries = new WorkerEntriesGenerator()

    compiler.hooks.compilation.tap(PLUGIN_NAME, () => {
      /**
       * When worker node has be changed, like change some file content.
       * it will be recreated "__index__workers__.js"
       * trigger Master Node recompile.
       */
      this.removeAllListeners('UPDATE').on('UPDATE', data => {
        logger.info(ansicolors.green('WORKER::UPDATE'), ansicolors.blue(data.url))
        const { workerId, url } = data
        workerEntries.add(workerId)
        virtualModules.writeModule(`src/${workerEntries.getVFName(workerId)}`, url)
        virtualModules.writeModule('src/__index__workers__.js', workerEntries.get())
      })

      /**
       * When worker node be shutdown, like `Ctrl + C`
       * it will be recreated "__index__workers__.js"
       * trigger Master Node recompile.
       */
      this.removeAllListeners('CLOSE').on('CLOSE', data => {
        logger.info(ansicolors.green('WORKER::CLOSE'), ansicolors.blue(data.url))
        const { workerId } = data
        workerEntries.remove(workerId)
        virtualModules.writeModule(`src/${workerEntries.getVFName(workerId)}`, '')
        virtualModules.writeModule('src/__index__workers__.js', workerEntries.get())
      })
    })
  }

  /**
   *  Define two virtual files.
   *  "__index__workers__" is all worker nodes reference entry.
   *  like : ```
   *     require("https-loader!./__node0__.http");
   *     require("https-loader!./__node2__.http")
   *     require("https-loader!./__node3__.http")
   *       .....
   *  ``` use https-loader download worker node entry js file.
   *
   *  "__index_patch__.js" is virtual file responsible for associating files
   *  "Master.injected" and "__index__workers__.js"
   */
  getVirtualModulesOpts() {
    const { injected = '' } = this.options
    return {
      ['src/__index__workers__.js']: '',
      ['src/__index_patch__.js']: `${injected}; require('./__index__workers__.js');`
    }
  }

  /**
   * Inject in webpack context as virtual file.
   * "__webpack_public_path__" , "__index_injected__.js , "__index_patch__.js"
   */
  getInjectOpts(globalObject) {
    const defaultInjected = path.join(process.cwd(), 'src', '__index_injected__.js')
    let injectedContent = ''

    if (fs.existsSync(defaultInjected)) {
      injectedContent = `require('./src/__index_injected__.js')`
    }

    return () => `
      __webpack_public_path__=process.env.ASSET_PATH;
      ${globalObject}['__webpack_public_path__']=process.env.ASSET_PATH;
      ${injectedContent};
      require('./src/__index_patch__.js');
      `
  }

  apply(compiler) {
    const virtualModules = new VirtualModulesPlugin(this.getVirtualModulesOpts())
    virtualModules.apply(compiler)
    const globalObject = compiler.options.output.globalObject || defaultGlobalObject
    new InjectPlugin(this.getInjectOpts(globalObject)).apply(compiler)

    if (isDevServerRunning()) {
      this.watch(compiler, virtualModules)
      const masterEvents = new MasterEvents(this.localConfig.getPorts(true))
      masterEvents.on('command', value => this.emit(value.command, value.data))
      masterEvents.send('online', this.options)
    }
  }
}
