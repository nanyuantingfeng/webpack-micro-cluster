/***************************************************
 * Created by nanyuantingfeng on 2020/2/26 17:35. *
 ***************************************************/
const EventEmitter = require('events')
const zeromq = require('zeromq')
const logger = require('./helpers/logger')

module.exports = class MasterEvents extends EventEmitter {
  constructor(ports) {
    super()
    this.replySock = new zeromq.Reply()
    this.publisherSock = new zeromq.Publisher()
    this.__initialize(ports[0], ports[1])
  }

  async __initialize(port0, port1) {
    await this.replySock.bind('tcp://127.0.0.1:' + port0)
    await this.publisherSock.bind('tcp://127.0.0.1:' + port1)

    logger.info('MasterEvents Reply bind to port ' + port0)
    logger.info('MasterEvents Publisher bind to port ' + port1)

    for await (const [msg] of this.replySock) {
      this.emit('command', JSON.parse(String(msg)))
      await this.replySock.send(JSON.stringify({}))
    }
  }

  async send(topic, message) {
    await new Promise(resolve => setTimeout(resolve, 200))
    await this.publisherSock.send([topic, JSON.stringify(message)])
  }
}
