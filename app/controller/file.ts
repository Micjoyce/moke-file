import { Controller } from 'egg';
import { validateBySchema } from '../decorator/validator';

export default class FileController extends Controller {
  async upload() {
    const ctx = this.ctx;
    const file = ctx.request.files[0];
    const size = await ctx.service.fileUpload.getImgSize(file.filepath)
    const result = await ctx.service.fileUpload.upload({
      file: file.filepath,
      filename: file.filename,
      type: file.mime,
      width: size.width,
      height: size.height
    });
    ctx.cleanupRequestFiles()
    ctx.body = result
  }

  @validateBySchema({
    params: {
      type: 'object',
      properties: {
        fileKey: { type: 'string' },
      },
      required: [ 'fileKey' ]
    }
  })
  async download() {
    const { ctx } = this;
    const fileKey = ctx.params.fileKey;
    try {
      const { file, stream } = await ctx.service.fileUpload.download(fileKey);
      ctx.set('Content-Length', String(file.size));
      ctx.set('Content-Type', file.type || 'application/octet-stream');
      ctx.body = stream;
      return;
    } catch (error) {
      ctx.status = 404;
      return;
    }
  }

  @validateBySchema({
    params: {
      type: 'object',
      properties: {
        fileKey: { type: 'string' },
        w: { type: 'string' },
        h: { type: 'string' },
      },
      required: [ 'fileKey', 'w', 'h' ]
    }
  })
  async thumbnail() {
    const { ctx } = this;
    const { fileKey, w, h } = ctx.params;
    const width = Number(w)
    const height = Number(h)
    try {
      const { size, file, stream } = await ctx.service.fileUpload.thumbnail(fileKey, width, height);
      ctx.set('Content-Length', String(size));
      ctx.set('Content-Type', file.type || 'application/octet-stream');
      ctx.body = stream;
      return;
    } catch (error) {
      ctx.status = 404;
      return;
    }
  }
}
