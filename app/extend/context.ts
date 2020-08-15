/* eslint-disable @typescript-eslint/no-unused-vars */
import { Context } from 'egg';

export default {
  getMinioClient(this: Context, _: string) {
    return this.app.minio;
  },
};
