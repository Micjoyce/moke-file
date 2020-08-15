import { v4 } from 'uuid';

export default {
  getRandomId() {
    return v4().replace(/-/g, '');
  },
};
