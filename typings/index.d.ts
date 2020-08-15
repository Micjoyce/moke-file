import { MongooseModels, Application, Context } from 'egg';
import { UserAgentContext } from 'koa-useragent';
import { User } from '../app/types'

interface ContextState {
  user: User
  userId: string
  uid: string
  username: string
}


declare module 'egg' {
  interface IModel extends MongooseModels {}

  // extend app
  interface Application {
    model: IModel;
  }

  // extend context
  interface Context extends UserAgentContext {
    model: IModel;
    state: ContextState
  }
}