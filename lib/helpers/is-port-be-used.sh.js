#!/usr/bin/env node

const isPortReachable = require('is-port-reachable')

;(async () => {
  console.log(await isPortReachable(process.argv[2], { host: '127.0.0.1' }))
})()
