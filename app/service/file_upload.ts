import { Service } from 'egg';
import { badRequest } from '@hapi/boom';
import * as path from 'path';
import * as _ from 'lodash';
import { Readable } from 'stream';

export default class FileUploadService extends Service {
  private getFileKey(_: string) {
    return {
      fileKey: this.ctx.helper.getRandomId(),
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

  async upload(file: string | Readable, filename: string, type: string) {
    const { ctx } = this;
    const bucketName = this.getBucketName(filename);
    const { fileKey } = this.getFileKey(filename);
    const newFilename = fileKey
    await this.ensureBucketExist(bucketName);
    const minioClient = this.ctx.getMinioClient(bucketName);
    try {
      if (_.isString(file)) {
        await minioClient.fPutObject(bucketName, newFilename, file, {});
      } else {
        await minioClient.putObject(bucketName, newFilename, file);
      }
    } catch (error) {
      this.logger.error(`upload ${filename} error ${error}`);
    }
    const stat = await this.tryStatObject(bucketName, newFilename);
    if (!stat) {
      throw badRequest('Upload error');
    }
    // save
    await ctx.service.file.create({
      fileKey,
      type,
      size: stat.size,
      bucketName,
    })
    return this.getDownloadUrl(newFilename);
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

  async download(fileKey: string) {
    const { ctx } = this;
    const file = await ctx.service.file.findOneByFileKey(fileKey)
    if (!file) {
      throw badRequest('Not found file')
    }
    const bucketName = file.bucketName;
    const minioClient = this.ctx.getMinioClient(bucketName);
    const stat = await this.tryStatObject(bucketName, fileKey);
    if (!stat) {
      throw badRequest(`Not found file ${fileKey}`);
    }
    const stream = await minioClient.getObject(bucketName, fileKey);
    return {
      file,
      stream,
    };
  }
}
