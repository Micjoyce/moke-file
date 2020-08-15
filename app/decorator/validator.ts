import { badRequest } from '@hapi/boom';

type Schema = boolean | object

interface ValidateSchema {
  body?: Schema;
  query?: Schema;
  queries?: Schema;
  params?: Schema;
  headers?: Schema;
}

export function validateBySchema(validateSchema: ValidateSchema) {
  return function(_0: any, _1: string | symbol, descriptor: PropertyDescriptor) {
    const originFunc = descriptor.value;
    descriptor.value = async function(...args: any[]) {
      const ctx = (this as any).ctx;
      const { ajv } = ctx.app;
      Object.entries(validateSchema).forEach(([ key, schema ]) => {
        const data = key === 'body' ? ctx.request.body : ctx[key];

        const valid = ajv.validate(schema, data);
        if (!valid) {
          const message = ajv.errors!.reduce(
            (m: any, { dataPath, message }) => `${key} ${m}${dataPath}${message}`,
            '',
          );
          throw badRequest(message);
        }
        if (!ctx.state._data) {
          ctx.state._data = {};
        }
        ctx.state._data[key] = data;
      });
      await originFunc.apply(this, args);
    };
  };
}

