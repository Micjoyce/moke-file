/* eslint-disable @typescript-eslint/no-unused-vars */
import { Service } from 'egg';
import { badRequest } from '@hapi/boom';
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as gm from 'gm';
import { Readable } from 'stream';
import { extension, lookup } from 'mime-types';
import { file as tmpFile } from 'tmp-promise';
import { dir } from 'tmp-promise';

export default class FileUploadService extends Service {
  private getFileKey(_: string) {
    return {
      fileKey: this.ctx.helper.getRandomId(),
    };
  }

  private getDownloadUrl(fileKey: string) {
    return '/file/' + fileKey;
  }

  private getThumbnailUrl(fileKey: string, width: number, height: number) {
    return `/thumbnail/${fileKey}/w/${width}/h/${height}`;
  }

  private getPreviewUrl(fileKey: string) {
    return `/preview/${fileKey}`;
  }

  private getBucketName(filename: string) {
    const extname = path.extname(filename).toLocaleLowerCase();
    if (/^thumbnail/.test(filename)) {
      return 'thumbnail';
    }
    if (/^preview/.test(filename)) {
      return 'preview';
    }
    if (this.config.multipart.fileExtensions?.includes(extname)) {
      return 'file';
    }
    return 'other';
  }

  private async ensureFileExist(fileKey: string) {
    const { ctx } = this;
    const file = await ctx.service.file.findOneByFileKey(fileKey);
    if (!file) {
      throw badRequest('Not found file');
    }
    const bucketName = file.bucketName;
    const stat = await this.tryStatObject(bucketName, fileKey);
    if (!stat) {
      throw badRequest(`Not found file ${fileKey}`);
    }
    return { file, stat };
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
    const { file, filename, type, width, height } = options;
    const { ctx } = this;
    const bucketName = this.getBucketName(filename);
    const { fileKey } = this.getFileKey(filename);
    const newFilename = fileKey;
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
    });
    if (this.isImgFile(filename)) {
      return {
        downloadUrl: this.getDownloadUrl(newFilename),
        thumbnailUrl: this.getThumbnailUrl(fileKey, 200, 200),
        previewUrl: this.getPreviewUrl(fileKey),
      };
    }
    return {
      downloadUrl: this.getDownloadUrl(newFilename),
      previewUrl: this.getPreviewUrl(fileKey),
    };
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
    const { file } = await this.ensureFileExist(fileKey);
    const minioClient = ctx.getMinioClient(file.bucketName);
    const stream = await minioClient.getObject(file.bucketName, fileKey);
    return {
      file,
      stream,
    };
  }


  isImgFile(filepath: string) {
    const extname = path.extname(filepath).toLocaleLowerCase();
    return [ '.jpg', '.jpeg', '.png', '.gif' ].includes(extname);
  }

  async getImgSize(filepath: string) {
    if (this.isImgFile(filepath) === false) {
      return {
        width: 0,
        height: 0,
      };
    }
    return new Promise<gm.Dimensions>((resolve, reject) => {
      this.app.imageMagick(filepath)
        .size((err, size) => {
          if (err) {
            return reject(err);
          }
          resolve(size);
        });
    });
  }

  async thumbnail(fileKey: string, width: number, height: number) {
    const { ctx } = this;
    const { file } = await this.ensureFileExist(fileKey);
    const fileExtension = extension(file.type);
    const thumbnailFilename = `thumbnail_${fileKey}_${width}_${height}.${fileExtension}`;
    const bucketName = this.getBucketName(thumbnailFilename);

    // 如果 thumbnail 存在，直接返回
    let stat = await this.tryStatObject(bucketName, thumbnailFilename);
    if (stat) {
      const thumbnailMinioClient = this.ctx.getMinioClient(bucketName);
      const thumbnailStream = await thumbnailMinioClient.getObject(
        bucketName,
        thumbnailFilename,
      );
      return {
        type: file.type,
        size: stat.size,
        stream: thumbnailStream,
      };
    }

    const minioClient = ctx.getMinioClient(file.bucketName);
    const stream = await minioClient.getObject(file.bucketName, fileKey);
    const tmpFs = await tmpFile({ postfix: `.${fileExtension}` });

    // 写入临时文件中
    await new Promise((resolve, reject) => {
      this.app.imageMagick(stream)
        .resize(width, height)
        .write(tmpFs.path, err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
    });

    const readStream = fs.createReadStream(tmpFs.path);
    await this.ensureBucketExist(bucketName);
    const thumbnailMinioClient = this.ctx.getMinioClient(bucketName);
    await thumbnailMinioClient.putObject(bucketName, thumbnailFilename, readStream);
    // clear tmp file
    await tmpFs.cleanup();

    stat = await this.tryStatObject(bucketName, thumbnailFilename);
    if (!stat) {
      throw badRequest(`Not found thumbnail fileKey: ${fileKey} w: ${width} h: ${height}`);
    }
    const thumbnailStream = await thumbnailMinioClient.getObject(bucketName, thumbnailFilename);
    return {
      type: file.type,
      size: stat.size,
      stream: thumbnailStream,
    };
  }
  async filePreview(fileKey: string) {
    const { ctx } = this;
    const { file, stat } = await this.ensureFileExist(fileKey);
    const fileExtension = extension(file.type) as string;
    // pdf 直接返回数据
    const minioClient = ctx.getMinioClient(file.bucketName);
    if ([ 'pdf', 'gif' ].includes(fileExtension)) {
      const stream = await minioClient.getObject(file.bucketName, fileKey);
      return {
        type: lookup(`.${fileExtension}`),
        stream,
        size: stat.size,
      };
    }
    if (this.isImgFile(`.${fileExtension}`)) {
      return this.thumbnail(fileKey, file.width / 2, file.height / 2);
    }

    // 生成预览文件
    const previewFilename = `preview_${fileKey}.pdf`;
    const bucketName = this.getBucketName(previewFilename);
    await this.ensureBucketExist(bucketName);
    const preveiwMinioClient = this.ctx.getMinioClient(bucketName);

    // check preview file exist
    let previewStat = await this.tryStatObject(bucketName, previewFilename);
    if (previewStat) {
      const existPreviewStream = await preveiwMinioClient.getObject(
        bucketName,
        previewFilename,
      );
      return {
        type: lookup('.pdf'),
        size: previewStat.size,
        stream: existPreviewStream,
      };
    }

    // office to pdf
    const tmpDir = await dir({ unsafeCleanup: true });
    const rawFilepath = path.join(tmpDir.path, `${fileKey}.${fileExtension}`);
    // save to local
    await minioClient.fGetObject(file.bucketName, fileKey, rawFilepath);
    const cmd = `soffice --headless --invisible --convert-to pdf ${rawFilepath}`;
    const { stdout } = await ctx.helper.execCmd(cmd, { encoding: null, cwd: tmpDir.path });
    const previewFilePath = stdout.split(' ').find(item => item.endsWith('.pdf'));
    if (!previewFilePath) {
      throw badRequest(`Create preview file error fileKey: ${fileKey}`);
    }
    // upload
    await preveiwMinioClient.putObject(bucketName, previewFilename, fs.createReadStream(previewFilePath));
    await tmpDir.cleanup();

    previewStat = await this.tryStatObject(bucketName, previewFilename);
    if (!previewStat) {
      throw badRequest(`Not found preview file fileKey: ${fileKey}`);
    }
    const previewStream = await preveiwMinioClient.getObject(bucketName, previewFilename);
    return {
      type: lookup('.pdf'),
      size: previewStat.size,
      stream: previewStream,
    };
  }

}
