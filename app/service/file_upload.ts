import { Service } from 'egg';
import { badRequest } from '@hapi/boom';
import { URL } from 'url';
import * as os from 'os';
import { parse } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import { Readable } from 'stream';

export default class FileUploadService extends Service {
  private getFilePath(filename: string) {
    const fileDir = path.join(os.homedir(), '/uploads');
    if (fs.existsSync(fileDir) === false) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    const prefix = this.ctx.state.username ? this.ctx.state.username + '-' : '';
    return {
      filePath: path.join(fileDir, filename),
      fileKey: prefix + filename,
    };
  }

  private getDownloadUrl(fileKey: string) {
    return '/files/' + fileKey;
  }

  private getBucketName(filename: string) {
    const extname = path.extname(filename).toLocaleLowerCase();
    if (this.config.multipart.fileExtensions?.includes(extname)) {
      return this.config.bucketName
    }
    return 'other';
  }

  getFilenameFrompath(fileUrl: string) {
    const pathname = parse(fileUrl).pathname;
    if (!pathname) {
      return '';
    }
    const filename = path.basename(pathname);
    return filename;
  }

  buildFullOuterUrl(downloadUrl: string) {
    if (/^http/.test(downloadUrl) === false) {
      return this.config.appUrl + downloadUrl;
    }
    return downloadUrl;
  }

  async ensureBucketExist(bucketName: string) {
    const minioClient = this.ctx.getMinioClient(bucketName);
    const isExists = await minioClient.bucketExists(bucketName);
    if (!isExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }
  }

  async upload(file: string | Readable, filename: string, rename = true) {
    const extname = path.extname(filename).toLocaleLowerCase();
    let newFileName = filename;
    if (rename) {
      newFileName = this.ctx.helper.getRandomId() + extname;
    }
    const { fileKey } = this.getFilePath(newFileName);
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

  async download(filenames: string) {
    const bucketName = this.getBucketName(filenames);
    const minioClient = this.ctx.getMinioClient(bucketName);
    const stat = await minioClient.statObject(bucketName, filenames);
    if (!stat) {
      throw badRequest(`not found file ${filenames}`);
    }
    const stream = await minioClient.getObject(bucketName, filenames);
    return {
      stream,
      size: stat.size,
    };
  }

  async getMinioDownloadUrl(fileUrl: string) {
    const filename = this.getFilenameFrompath(fileUrl);
    if (!filename) {
      throw badRequest(`not found fileUrl ${fileUrl}`);
    }
    const bucketName = this.getBucketName(filename);
    const minioClient = this.ctx.getMinioClient(bucketName);
    const minioBucketConfigs = this.config.minioBucketConfigs;
    if (minioBucketConfigs.readOnlyBucketNames.includes(bucketName)) {
      const minioUrl = await minioClient.presignedGetObject(bucketName, filename);
      const urlObj = new URL(minioUrl);
      return this.config.fileListUrl + urlObj.pathname;
    }
    return this.buildFullOuterUrl(fileUrl);
  }

  async tryStatObject(bucketName: string, objectName: string) {
    try {
      const minioClient = this.ctx.getMinioClient(bucketName);
      const info = await minioClient.statObject(bucketName, objectName);
      return info;
    } catch (error) {
      return null;
    }
  }

  async removeFile(filePath: string) {
    const filename = this.getFilenameFrompath(filePath);
    const bucketName = this.getBucketName(filename);
    const exists = await this.tryStatObject(bucketName, filename);
    const minioClient = this.ctx.getMinioClient(bucketName);
    if (exists) {
      await minioClient.removeObject(bucketName, filename);
    }
  }
}
