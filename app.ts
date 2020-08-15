import { Application } from 'egg';

export default class AppBootHook {
  // eslint-disable-next-line no-useless-constructor
  constructor(public app: Application) {
  }

  configWillLoad() {
    // Ready to call configDidLoad,
    // Config, plugin files are referred,
    // this is the last chance to modify the config.
  }

  configDidLoad() {
    // Config, plugin files have been loaded.
  }

  async didLoad() {
    // All files have loaded, start plugin here.
  }

  async willReady() {
    // All plugins have started, can do some thing before app ready
  }

  async didReady() {
    // Worker is ready, can do some things
    // don't need to block the app boot.
  }

  async serverDidReady() {
    // Server is listening.
    // 在这里面执行一些程序启动的脚本，但不要处理耗时特别长的
    // 否则egg回报启动错误
  }

  async beforeClose() {
    // Do some thing before app close.
  }
}
