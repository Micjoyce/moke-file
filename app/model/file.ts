import { Application } from 'egg';
import { Document, Model } from 'mongoose';
import { File } from '../types';

export type FileDocument = File & Document;

export type FileModel = Model<FileDocument>;

export default (app: Application) => {
  const { Schema, model } = app.mongoose;

  const fileSchema = new Schema(
    {
      fileKey: String,
      size: Number,
      type: String,
      bucket: String,
      deleted: { type: Boolean, default: false },
    },
    {
      timestamps: true,
    },
  );

  return model<FileDocument, FileModel>('files', fileSchema);
};
