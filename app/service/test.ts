import { Service } from 'egg';

export default class UdidService extends Service {
  async sayHello(name: string) {
    return `hello, ${name}!`;
  }
}
