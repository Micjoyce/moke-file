import * as egg from 'egg';

// 需要先将typescript编译后才可以直接node server.js启动程序
// 可以通过npm run start 启动
const workers = 1;
// const workers = Number(process.argv[2] || require('os').cpus().length)

console.info(`Runing PORT: ${process.env.PORT}, EGG_SERVER_ENV: ${process.env.EGG_SERVER_ENV}, NODE_ENV: ${process.env.NODE_ENV}`);

egg.startCluster({
  workers,
  baseDir: __dirname,
}, () => {
  console.info('start server');
});
