import { Service } from 'egg';
import { badRequest } from '@hapi/boom';
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as gm from 'gm'
import { Readable } from 'stream';
import { extension } from 'mime-types'
import { file as tmpFile } from 'tmp-promise';

export default class FileUploadService extends Service {
  private getFileKey(_: string) {
    return {
      fileKey: this.ctx.helper.getRandomId(),
    };
  }

  private getDownloadUrl(fileKey: string) {
    return '/file/' + fileKey;
  }

  private getThumbnailDownloadUrl(fileKey: string, width: number, height: number) {
    return `/thumbnail/${fileKey}/w/${width}/h/${height}`
  }

  private getBucketName(filename: string) {
    const extname = path.extname(filename).toLocaleLowerCase();
    if (/^thumbnail/.test(filename)) {
      return 'thumbnail'
    }
    if (this.config.multipart.fileExtensions?.includes(extname)) {
      return 'file'
    }
    return 'other';
  }

  private async ensureFileExist(fileKey: string) {
    const { ctx } = this;
    const file = await ctx.service.file.findOneByFileKey(fileKey)
    if (!file) {
      throw badRequest('Not found file')
    }
    const bucketName = file.bucketName;
    const stat = await this.tryStatObject(bucketName, fileKey);
    if (!stat) {
      throw badRequest(`Not found file ${fileKey}`);
    }
    return file;
  }

  async ensureBucketExist(bucketName: string) {
    const minioClient = this.ctx.getMinioClient(bucketName);
    const isExists = await minioClient.bucketExists(bucketName);
    if (!isExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }
  }

  async upload(options: {
    file: string | Readable;
    filename: string;
    type: string;
    width: number;
    height: number;
  }) {
    const { file, filename, type, width, height} = options
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
      width,
      height,
    })
    if (this.isImgFile(filename)) {
      return {
        downloadUrl: this.getDownloadUrl(newFilename),
        thumbnailUrl: this.getThumbnailDownloadUrl(fileKey, 200, 200)
      }
    }
    return {
      downloadUrl: this.getDownloadUrl(newFilename),
    }
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
    const file = await this.ensureFileExist(fileKey);
    const minioClient = ctx.getMinioClient(file.bucketName);
    const stream = await minioClient.getObject(file.bucketName, fileKey);
    return {
      file,
      stream,
    };
  }


  isImgFile(filepath: string) {
    const extname = path.extname(filepath).toLocaleLowerCase();
    return ['.jpg','.jpeg','.png','.gif'].includes(extname)
  }

  async getImgSize(filepath: string) {
    if (this.isImgFile(filepath) === false) {
      return {
        width: 0,
        height: 0,
      }
    }
    return new Promise<gm.Dimensions>((resolve, reject) => {
      this.app.imageMagick(filepath)
        .size((err, size) => {
          if(err) {
            return reject(err);
          }
          resolve(size);
        })
    })
  }

  async thumbnail(fileKey: string, width: number, height: number) {
    const { ctx } = this;
    const file = await this.ensureFileExist(fileKey);
    const fileExtension = extension(file.type);
    const thumbnailFilename = `thumbnail_${fileKey}_${width}_${height}.${fileExtension}`
    const bucketName = this.getBucketName(thumbnailFilename)

    // 如果 thumbnail 存在，直接返回
    let stat = await this.tryStatObject(bucketName, thumbnailFilename);
    if (stat) {
      const thumbnailMinioClient = this.ctx.getMinioClient(bucketName);
      const thumbnailStream = await thumbnailMinioClient.getObject(
        bucketName,
        thumbnailFilename
      );
      return {
        file,
        size: stat.size,
        stream: thumbnailStream,
      }
    }
    
    const minioClient = ctx.getMinioClient(file.bucketName);
    const stream = await minioClient.getObject(file.bucketName, fileKey);
    const tmpFs = await tmpFile({ postfix: `.${fileExtension}` });

    // 写入临时文件中
    await new Promise((resolve, reject) => {
      this.app.imageMagick(stream)
        .resize(width, height)
        .write(tmpFs.path, (err) => {
          if(err) {
            return reject(err);
          }
          resolve();
        })
    })

    const readStream = fs.createReadStream(tmpFs.path);
    await this.ensureBucketExist(bucketName);
    const thumbnailMinioClient = this.ctx.getMinioClient(bucketName);
    await thumbnailMinioClient.putObject(bucketName, thumbnailFilename, readStream);
    // clear tmp file
    await tmpFs.cleanup()

    stat = await this.tryStatObject(bucketName,thumbnailFilename)
    if (!stat) {
      throw badRequest(`Not found thumbnail fileKey: ${fileKey} w: ${width} h: ${height}`)
    }
    const thumbnailStream = await thumbnailMinioClient.getObject(bucketName, thumbnailFilename);
    return {
      file,
      size: stat.size,
      stream: thumbnailStream,
    }
  }
}
