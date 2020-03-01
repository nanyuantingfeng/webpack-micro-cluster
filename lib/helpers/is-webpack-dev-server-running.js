/***************************************************
 * Created by nanyuantingfeng on 2020/3/1 14:00. *
 ***************************************************/
module.exports = function isDevServerRunning() {
  return process.env.WEBPACK_DEV_SERVER === 'true'
}
