/***************************************************
 * Created by nanyuantingfeng on 2020/2/26 17:35. *
 ***************************************************/
const EventEmitter = require('events')
const ipc = require('node-ipc')

module.exports = class WorkerEvents extends EventEmitter {
  constructor(id, masterId) {
    super()
    this.masterId = masterId
    ipc.config.id = id
    ipc.config.retry = 1000
    ipc.config.silent = true

    ipc.connectTo(masterId, () => {
      ipc.of[masterId].on('message', data => {
        this.emit(data.command, data.data)
      })

      ipc.of[masterId].on('connect', () => {
        this.emit('online')
      })
    })
  }

  send(value) {
    ipc.of[this.masterId].emit('message', value)
  }
}
