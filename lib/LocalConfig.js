/***************************************************
 * Created by nanyuantingfeng on 2020/2/27 14:29. *
 ***************************************************/
const path = require('path')
const os = require('os')
const fs = require('fs')
const logger = require('./helpers/logger')
const findFreePort = require('./helpers/find-free-port')
const isPortBeUsed = require('./helpers/is-port-be-used')

module.exports = class LocalConfig {
  constructor(masterName) {
    this.configFilePath = path.join(os.homedir(), '.webpack-micro-cluster.json')

    if (!fs.existsSync(this.configFilePath)) {
      fs.writeFileSync(this.configFilePath, '{}')
    }

    this.masterName = masterName
    this.configData = require(this.configFilePath)
    this.dataset = this.configData[masterName] || {}
  }

  save() {
    Object.assign(this.configData, { [this.masterName]: this.dataset })
    const data = JSON.stringify(this.configData)
    fs.writeFileSync(this.configFilePath, data)
    logger.info(this.configFilePath, '=>', data)
  }

  set(name, value) {
    Object.assign(this.dataset, { [name]: value })
    this.save()
  }

  get(name) {
    return this.dataset[name]
  }

  __getNewTwoPorts() {
    const p0 = findFreePort(30223)
    const p1 = findFreePort(p0)
    return [p0, p1]
  }

  getPorts(detect) {
    let ports = this.get('ports')

    if (!ports || !ports.length) {
      ports = this.__getNewTwoPorts()
      this.set('ports', ports)
      return ports
    }

    if (detect) {
      if (isPortBeUsed(ports[0]) || isPortBeUsed(ports[1])) {
        ports = this.__getNewTwoPorts()
        this.set('ports', ports)
        return ports
      }
    }

    return ports
  }
}
