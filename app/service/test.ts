import { Service } from 'egg';
import * as _ from 'lodash';

export default class UdidService extends Service {
  async sayHello(name: string) {
    return `hello, ${name}!`;
  }
}
