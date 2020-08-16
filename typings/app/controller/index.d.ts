// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportFile from '../../../app/controller/file';
import ExportGrpc = require('../../../app/controller/grpc');
import ExportHome from '../../../app/controller/home';

declare module 'egg' {
  interface IController {
    file: ExportFile;
    grpc: ExportGrpc;
    home: ExportHome;
  }
}
