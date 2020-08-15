import { MongooseModels, Application, Context } from 'egg';
import { UserAgentContext } from 'koa-useragent';

declare module 'egg' {
  interface IModel extends MongooseModels {}

  // extend app
  interface Application {
    model: IModel;
  }

  // extend context
  interface Context extends UserAgentContext {
    model: IModel;
  }
}