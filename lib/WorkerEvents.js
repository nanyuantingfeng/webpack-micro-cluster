/***************************************************
 * Created by nanyuantingfeng on 2020/2/26 17:35. *
 ***************************************************/
const EventEmitter = require('events')
const zeromq = require('zeromq')
const logger = require('./helpers/logger')

module.exports = class WorkerEvents extends EventEmitter {
  constructor(ports) {
    super()

    this.requestSock = new zeromq.Request()
    this.subscriberSock = new zeromq.Subscriber()

    this.requestSock.connect('tcp://127.0.0.1:' + ports[0])
    this.subscriberSock.connect('tcp://127.0.0.1:' + ports[1])

    logger.info('WorkerEvents Request connect to port ' + ports[0])
    logger.info('WorkerEvents Subscriber connect to port ' + ports[1])

    this.__receive__subscriber__()
  }

  async send(value) {
    await this.requestSock.send(JSON.stringify(value))
    const [result] = await this.requestSock.receive()
    return JSON.parse(String(result))
  }

  subscribe(topic, handler) {
    this.subscriberSock.subscribe(topic)
    this.on(topic, handler)
  }

  async __receive__subscriber__() {
    for await (const [topic, msg] of this.subscriberSock) {
      this.emit(String(topic), JSON.parse(String(msg)))
    }
  }
}
