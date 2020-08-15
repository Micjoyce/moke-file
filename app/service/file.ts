import { Service } from 'egg';
import { File } from '../types';
// import { badRequest } from '@hapi/boom';

export default class UserService extends Service {
  private buildQuery(query: object) {
    return { ...query, deleted: false };
  }
  // findOne
  async findOneByFileKey(fileKey: string) {
    return this.ctx.model.Balance.find(this.buildQuery({
      fileKey
    }));
  }
  // find
  // create
  async create(file: File) {
    return this.ctx.model.File.create(file)
  }
  // delete
}
