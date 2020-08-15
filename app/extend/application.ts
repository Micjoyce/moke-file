import { Application } from 'egg';
import * as Ajv from 'ajv';
import * as Minio from 'minio';

const AJV = Symbol('Application#AJV');
const MINIO = Symbol('Application#minio');

export default {
  get ajv(): Ajv.Ajv {
    if (!this[AJV]) {
      const ajv = new Ajv({
        useDefaults: true,
      });
      ajv.addFormat('objectId', /^[a-f\d]{24}$/i);
      ajv.addFormat('phone', /^[1]([3-9])[0-9]{9}$/);
      this[AJV] = ajv;
    }
    return this[AJV];
  },
  get minio(): Minio.Client {
    if (!this[MINIO]) {
      const self = this as Application;
      this[MINIO] = new Minio.Client(self.config.minioOptions);
    }
    return this[MINIO];
  },
};
