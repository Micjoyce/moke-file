import * as assert from 'assert';
import { Context } from 'egg';
import { app } from 'egg-mock/bootstrap';

describe('test/app/service/file_upload.test.ts', () => {
  let ctx: Context;

  before(async () => {
    ctx = app.mockContext();
  });

  it('is img file', async () => {
    const thumbnailUrl = ctx.service.fileUpload.isImgFile('xxx.png');
    assert(thumbnailUrl);
  });
});
