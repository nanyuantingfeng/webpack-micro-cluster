# webpack-micro-cluster

>  multiple webpack instances working together

[![Build Status](https://travis-ci.org/nanyuantingfeng/webpack-micro-cluster.svg?branch=master)](https://travis-ci.org/nanyuantingfeng/webpack-micro-cluster)
[![GitHub repo size](https://img.shields.io/github/repo-size/nanyuantingfeng/webpack-micro-cluster)](https://img.shields.io/github/repo-size/nanyuantingfeng/webpack-micro-cluster)

#### Install

```npm
npm install --save-dev webpack-micro-cluster
```



#### Introduction

`webpack-micro-cluster` is a webpack plugin at webpack-dev-server environment. In the large amount of code single project, debugging performance optimization can be given a less costly solution.It can also be used in dev support of the migration process from single project to micro services.



#### Usage

```js
// Master Node webpack.config.js

module.exports = {
 // ....
  
  plugins: [
   //...
    new Master({
      masterId: 'demo', // The Name of Master
      injected: [`var __WORKERS__ = window.__WORKERS__ = window.__WORKERS__ || {};`]
    })
  ]
}

// `injected` will be injected into the top of main context 

// Worker Node webpack.config.js
module.exports = {
  entry: {
    index: './index.js'
  },
  
  output: {
 		// ....
    libraryTarget: 'assign',  
    libraryExport: 'default',
    library: ['__WORKERS__', 'worker0'] 
  },
  
  plugins: [
   //...
    new Worker({
      masterId: 'demo', // The Name of Master
      workerId: 'worker0', // The Name of Current Worker Node,
      entry : "index" // default is "index" 
    })
  ]
}

```



#### API

Master

  * `masterId` : `string`   

     the name of master node, provided for configuration file use.it also provides a dist for worker nodes

*  `injected?` : `Array<string | Loader | [string | Loader, IInjectOptions]>`

     will be injected into the top of main context . you can put some pre-processing logic .
        
     1. `string` : injected Content
     2. `Loader` :  () => string
     3. `IInjectOptions` :  [webpack-inject-plugin](https://github.com/adierkens/webpack-inject-plugin) \`s options
    



Worker 

 * `masterId`: `string`   

   point to a master node

*  `workerId` : `string`

   the name of current worker node, you must ensure that the node name is unique under the same masterId ,because this value is the basis for the master node to perform the update operation.

*  `entry?`: `string`  // default : "index"

   the entry represents the reference file name of the output performed by the current worker node, which is sent to the master node as the source of the updated file contents.









#### Features

* ability to make multiple webpack instances working together

* automatically update the contents of the master node when the worker nodes start and stop

* quick response to recompile

* without using any hacks to interfere with the webpack execution logic, you can refer directly to an existing webpack project

   
  
