import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};

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

  return config;
};
