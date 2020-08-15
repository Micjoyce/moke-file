import { BaseModel, BaseCreateModel } from './base';

export interface FilePagination {
  current: number;
  pageSize: number;
  sortKey?: string;
  sortOrder?: number;
}

export interface File extends BaseModel {
  fileKey: string;
  size: number;
  type: string;
  bucketName: string;
}


export type FileCreateModel = BaseCreateModel<File, ''>

export type FileQueryModel = Pick<File, Exclude<keyof File, '_id'>>

