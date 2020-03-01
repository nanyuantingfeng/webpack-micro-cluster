/***************************************************
 * Created by nanyuantingfeng on 2020/2/27 14:06. *
 ***************************************************/
const path = require('path')
const { execSync } = require('child_process')

module.exports = port => {
  return execSync(`${process.execPath} ${path.resolve(__dirname, './is-port-be-used.sh.js')} ${port}`)
    .toString()
    .trim()
}
