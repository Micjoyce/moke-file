// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportErrorHandler from '../../../app/middleware/error_handler';
import ExportRequestLogger from '../../../app/middleware/request_logger';
import ExportUserAgent from '../../../app/middleware/user_agent';

declare module 'egg' {
  interface IMiddleware {
    errorHandler: typeof ExportErrorHandler;
    requestLogger: typeof ExportRequestLogger;
    userAgent: typeof ExportUserAgent;
  }
}
