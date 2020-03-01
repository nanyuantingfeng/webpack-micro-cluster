/***************************************************
 * Created by nanyuantingfeng on 2020/3/1 17:53. *
 ***************************************************/
console.log('master-node', Math.random())
function log() {
  const p = window.document.createElement('p')
  p.innerHTML = JSON.stringify(arguments)
  window.document.body.appendChild(p)
}

log('HELLO Word')

Object.keys(window.__WORKERS__).forEach(name => {
  window.__WORKERS__[name](log)
})
