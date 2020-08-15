import { Context } from 'egg';

export default {
  getMinioClient(this: Context, _: string) {
    return this.app.minio;
  },
};
