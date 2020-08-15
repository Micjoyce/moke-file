import * as Boom from '@hapi/boom';
import { Context } from 'egg';

const errorHandle = () => async (ctx: Context, next: () => Promise<any>) => {
  try {
    await next();
  } catch (err) {
    ctx.app.emit('error', err);
    const response = Boom.isBoom(err)
      ? err
      : Boom.boomify(err, { statusCode: err.status || 400 });

    const { payload } = response.output;

    ctx.status = payload.statusCode > 500 ? 500 : payload.statusCode;
    if (payload && payload.message) {
      payload.message = ctx.__(payload.message);
    }
    ctx.body = payload;
  }
};

export default errorHandle;
