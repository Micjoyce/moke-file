import { Application } from 'egg';
import * as Minio from 'minio';
const MINIO = Symbol('Application#minio');

export default {
  get minio(): Minio.Client {
    if (!this[MINIO]) {
      const self = this as Application;
      this[MINIO] = new Minio.Client(self.config.minioOptions);
    }
    return this[MINIO];
  },
};
