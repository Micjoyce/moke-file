import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import * as path from 'path';
import * as os from 'os';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.keys = appInfo.name + '_1597479479437';

  config.middleware = [ 'userAgent', 'requestLogger', 'errorHandler' ];

  const port = process.env.PORT && Number(process.env.PORT);
  config.cluster = {
    listen: {
      port,
    },
  };

  config.view = {
    mapping: {
      '.html': 'nunjucks',
    },
  };

  config.mongoose = {
    client: {
      url: 'mongodb://mongo:27017/moke-file',
      options: {
        useUnifiedTopology: true,
      },
    },
  };

  config.redis = {
    client: {
      host: 'redis',
      port: 6379,
      password: '',
      db: 0,
      keyPrefix: 'MOKE_FILE',
    },
  };

  config.minioOptions = {
    endPoint: 'minio',
    port: 9000,
    useSSL: false,
    accessKey: '1C586744E5BEC998',
    secretKey: '2A66526385B486E7DA2E74F42BB64',
  };

  config.logger = {
    outputJSON: true,
  };

  config.i18n = {
    defaultLocale: 'zh-CN',
    queryField: 'lang',
    cookieField: 'lang',
  };

  config.proxy = true;
  config.ipHeaders = 'X-Real-Ip, X-Forwarded-For';
  config.protocolHeaders = 'X-Real-Proto, X-Forwarded-Proto';
  config.maxIpsCount = 1;

  config.multipart = {
    mode: 'file',
    tmpdir: path.join(os.tmpdir(), 'multipart-tmp', appInfo.name),
    cleanSchedule: {
      // run tmpdir clean job on every day 04:30 am
      // cron style see https://github.com/eggjs/egg-schedule#cron-style-scheduling
      cron: '0 30 4 * * *',
    },
    fileSize: '500mb',
    fileExtensions: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.pdf',
      '.xlsx',
      '.xls',
      '.docx',
      '.doc',
      '.pptx',
      '.ppt',
    ],
  };

  return config;
};
