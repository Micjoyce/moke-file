export interface BaseModel {
  _id: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BaseCreateModel<T, FT> = Pick<T, Exclude<keyof T, '_id' |'deleted' |'createdAt' |'updatedAt' | FT>>
