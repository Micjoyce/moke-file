import * as assert from 'assert';
import { Context } from 'egg';
import * as path from 'path';
import { app } from 'egg-mock/bootstrap';
import { dir } from 'tmp-promise';

const basePath = path.resolve(__dirname, '../../fixtures');
const officeFiles = [ 'ppt', 'xls', 'doc' ];

describe('test/app/service/file_upload.test.ts', () => {
  let ctx: Context;

  before(async () => {
    ctx = app.mockContext();
  });

  it('execCmd', async () => {
    for (const file of officeFiles) {
      const filepath = path.join(basePath, `./sample.${file}`);
      const tmpDir = await dir({ unsafeCleanup: true });
      const cmd = `soffice --headless --invisible --convert-to pdf ${filepath}`;
      const { stdout } = await ctx.helper.execCmd(cmd, { encoding: null, cwd: tmpDir.path });
      console.info(stdout);
      assert(stdout.indexOf('sample.pdf') !== -1);
      await tmpDir.cleanup();
    }
  });
});
