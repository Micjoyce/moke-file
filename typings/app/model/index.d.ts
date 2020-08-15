// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportFile from '../../../app/model/file';

declare module 'egg' {
  interface IModel {
    File: ReturnType<typeof ExportFile>;
  }
}
