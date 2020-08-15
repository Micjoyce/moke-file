import { Service } from 'egg';
import { badRequest } from '@hapi/boom';
import * as path from 'path';
import * as _ from 'lodash';
import { Readable } from 'stream';

export default class FileUploadService extends Service {
  private getFileKey(filename: string) {
    const extname = path.extname(filename).toLocaleLowerCase();
    return {
      fileKey: this.ctx.helper.getRandomId() + extname,
    };
  }

  private getDownloadUrl(fileKey: string) {
    return '/file/' + fileKey;
  }

  private getBucketName(filename: string) {
    const extname = path.extname(filename).toLocaleLowerCase();
    if (this.config.multipart.fileExtensions?.includes(extname)) {
      return this.config.bucketName
    }
    return 'other';
  }

  async ensureBucketExist(bucketName: string) {
    const minioClient = this.ctx.getMinioClient(bucketName);
    const isExists = await minioClient.bucketExists(bucketName);
    if (!isExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }
  }

  async upload(file: string | Readable, filename: string) {
    const { fileKey } = this.getFileKey(filename);
    const bucketName = this.getBucketName(fileKey);
    await this.ensureBucketExist(bucketName);
    const minioClient = this.ctx.getMinioClient(bucketName);
    try {
      if (_.isString(file)) {
        await minioClient.fPutObject(bucketName, fileKey, file, {});
      } else {
        await minioClient.putObject(bucketName, fileKey, file);
      }
    } catch (error) {
      this.logger.error(`upload ${fileKey} error ${error}`);
    }
    return this.getDownloadUrl(fileKey);
  }

  private async tryStatObject(bucketName: string, objectName: string) {
    try {
      const minioClient = this.ctx.getMinioClient(bucketName);
      const info = await minioClient.statObject(bucketName, objectName);
      return info;
    } catch (error) {
      return null;
    }
  }

  async download(filename: string) {
    const bucketName = this.getBucketName(filename);
    const minioClient = this.ctx.getMinioClient(bucketName);
    const stat = await this.tryStatObject(bucketName, filename);
    if (!stat) {
      throw badRequest(`Not found file ${filename}`);
    }
    const stream = await minioClient.getObject(bucketName, filename);
    return {
      stream,
      size: stat.size,
    };
  }
}
