import { Context } from 'egg';

export default {
  getMinioClient(this: Context, bucketName: string) {
    console.info(bucketName)
    return this.app.minio;
  },
};
