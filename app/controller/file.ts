import { Controller } from 'egg';
import { lookup } from 'mime-types';

export default class FileController extends Controller {
  async upload() {
    const ctx = this.ctx;
    const stream = await ctx.getFileStream();
    const downloadUrl = await ctx.service.fileUpload.upload(
      stream,
      stream.filename,
    );
    ctx.body = {
      downloadUrl,
    };
  }

  async download() {
    const { ctx } = this;
    const filename = ctx.params.fileKey;
    try {
      const { size, stream } = await ctx.service.fileUpload.download(filename);
      ctx.set('Cache-Control', 'public, max-age=600');
      ctx.set('Content-Disposition', 'inline');
      ctx.set('Content-Length', size.toString());
      ctx.set('Content-Type', lookup(filename) || 'application/octet-stream');
      ctx.body = stream;
      return;
    } catch (error) {
      ctx.status = 404;
      return;
    }
  }
}
