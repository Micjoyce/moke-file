import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.home.homePage);
  // 文件上传
  router.post('/upload', controller.file.upload);
  // 文件下载
  router.get('/file/:fileKey', controller.file.download);
  router.get('/thumbnail/:fileKey/w/:w/h/:h', controller.file.thumbnail);
  // 文件预览
  router.get('/preview/:fileKey', controller.file.filePreview);

};
