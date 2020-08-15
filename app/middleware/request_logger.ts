import { Application, Context } from 'egg';
import { get } from 'lodash';
const UNKNOWN_SERVICE = 'Unknown-Service';


export default function requestLogger(options: {
  name?: string;
  ignoreMethods?: string[];
}, app: Application): any {
  let serviceName = options.name || UNKNOWN_SERVICE;
  const ignoreMethods = options.ignoreMethods || [ 'options' ];
  if (!serviceName) serviceName = UNKNOWN_SERVICE;

  return async function(ctx: Context, next: () => Promise<any>) {
    if (
      [ 'test', 'sit' ].includes(app.config.env) ||
      ignoreMethods.includes(ctx.method.toLocaleLowerCase()) ||
      ctx.path.endsWith('/progress')
    ) {
      return await next();
    }
    const start = Date.now();
    await next();
    const data = {
      env: ctx.app.config.env || 'unknown',
      requestId: ctx.response.get('x-request-id') || 'unknown',
      route: ctx.originalUrl,
      ip: ctx.ip,
      method: ctx.method,
      status: ctx.status || 404,
      responseTime: Date.now() - start,
      userAgent: ctx.headers['user-agent'],
      username: get(ctx, 'state.username', '-'),
      userId: get(ctx, 'state.userId', '-'),
      erroInfo: ctx.status >= 400 ? ctx.body : {},
    };
    ctx.logger.info(JSON.stringify(data));
  };
}
