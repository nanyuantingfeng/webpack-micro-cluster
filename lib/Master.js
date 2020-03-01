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
    this.localConfig = new LocalConfig(options.masterName)
  }

  watch(compiler, virtualModules) {
    const workerEntries = new WorkerEntriesGenerator()

    compiler.hooks.compilation.tap(PLUGIN_NAME, () => {
      this.removeAllListeners('UPDATE').on('UPDATE', data => {
        logger.info(ansicolors.green('WORKER::UPDATE'), ansicolors.blue(data.url))
        const { workerName, url } = data
        workerEntries.add(workerName)
        virtualModules.writeModule(`src/${workerEntries.getVFName(workerName)}`, url + '/' + workerName + '.js')
        virtualModules.writeModule('src/__index__workers__.js', workerEntries.get())
      })
      this.removeAllListeners('CLOSE').on('CLOSE', data => {
        logger.info(ansicolors.green('WORKER::CLOSE'), ansicolors.blue(data.url))
        const { workerName } = data
        workerEntries.remove(workerName)
        virtualModules.writeModule(`src/${workerEntries.getVFName(workerName)}`, '')
        virtualModules.writeModule('src/__index__workers__.js', workerEntries.get())
      })
    })
  }

  getVirtualModulesOpts() {
    const { injected = '' } = this.options

    return {
      ['src/__index__workers__.js']: '',
      ['src/__index_patch__.js']: `${injected}; require('./__index__workers__.js');`
    }
  }

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
