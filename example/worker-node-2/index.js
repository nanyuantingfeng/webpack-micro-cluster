/***************************************************
 * Created by nanyuantingfeng on 2020/3/1 17:53. *
 ***************************************************/
console.log('worker-node-2', Math.random())

export default function(log) {
  log('worker-node-2', Math.random() * 1000000)
}
