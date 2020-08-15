import { Service } from 'egg';
import { FileCreateModel } from '../types';
// import { badRequest } from '@hapi/boom';

export default class UserService extends Service {
  private buildQuery(query: object) {
    return { ...query, deleted: false };
  }
  // findOne
  async findOneByFileKey(fileKey: string) {
    return this.ctx.model.File.findOne(this.buildQuery({
      fileKey,
    }));
  }
  // find
  // create
  async create(file: FileCreateModel) {
    const record = new this.ctx.model.File(file);
    await record.save();
    return record;
  }
  // delete
}
