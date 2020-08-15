import * as assert from 'assert';
import { app } from 'egg-mock/bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const basePath = path.resolve(__dirname, '../../fixtures');

const files = [ 'png', 'jpg', 'gif', 'pdf', 'ppt', 'xls', 'doc' ];
const imgFiles = [ 'png', 'jpg', 'gif' ];

describe('test/app/controller/file.test.ts', () => {
  describe('/upload', () => {
    it('should upload imgs ', async () => {
      for (const file of files) {
        app.mockCsrf();
        const { body } = await app.httpRequest().post('/upload')
          .type('form')
          .accept('application/json')
          .field('file', fs.createReadStream(path.join(basePath, `./sample.${file}`)))
          .expect(200);

        assert(body.downloadUrl);
        if (imgFiles.includes(file)) {
          assert(body.thumbnailUrl);
        }
      }
    });
  });
});
