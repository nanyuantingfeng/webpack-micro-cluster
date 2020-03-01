/***************************************************
 * Created by nanyuantingfeng on 2020/3/1 14:59. *
 ***************************************************/
import { Plugin } from 'webpack'

interface MasterOptions {
  masterName: string
  injected: string
}

interface WorkerOptions {
  masterName: string
  workerName: string
}

export interface Master extends Plugin {
  new (options: Master): Master
}

export interface Worker extends Plugin {
  new (options: WorkerOptions): Worker
}
