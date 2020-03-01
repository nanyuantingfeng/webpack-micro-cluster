/***************************************************
 * Created by nanyuantingfeng on 2020/3/1 14:59. *
 ***************************************************/
import { Plugin } from 'webpack'

export class Master extends Plugin {
  constructor(options: { masterId: string; injected: string })
}

export class Worker extends Plugin {
  constructor(options: { masterId: string; workerId: string; entry?: string })
}
