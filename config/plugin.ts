import { EggPlugin } from 'egg';

const plugin: EggPlugin = {
  // static: true,
  nunjucks: {
    enable: true,
    package: 'egg-view-nunjucks',
  },
  routerPlus: {
    enable: true,
    package: 'egg-router-plus',
  },
  mongoose: {
    enable: true,
    package: 'egg-mongoose',
  },
  redis: {
    enable: true,
    package: 'egg-redis',
  },
  healthy: {
    enable: true,
    package: 'egg-healthy',
  },
};

export default plugin;
