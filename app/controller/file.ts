import { Controller } from 'egg';
import { validateBySchema } from '../decorator/validator';

export default class FileController extends Controller {
  async upload() {
    const ctx = this.ctx;
    const file = ctx.request.files[0];
    const downloadUrl = await ctx.service.fileUpload.upload(
      file.filepath,
      file.filename,
      file.mime,
    );
    ctx.cleanupRequestFiles()
    ctx.body = {
      downloadUrl,
    };
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
      ctx.set('Cache-Control', 'public, max-age=600');
      ctx.set('Content-Disposition', 'inline');
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
    console.info(width, height)
    try {
      const { file, stream } = await ctx.service.fileUpload.download(fileKey);
      ctx.set('Cache-Control', 'public, max-age=600');
      ctx.set('Content-Disposition', 'inline');
      ctx.set('Content-Length', String(file.size));
      ctx.set('Content-Type', file.type || 'application/octet-stream');
      ctx.body = stream;
      return;
    } catch (error) {
      ctx.status = 404;
      return;
    }
  }
}
