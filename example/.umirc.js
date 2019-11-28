import { join } from 'path';

export default {
  singular: false,
  plugins: [
    [join(__dirname, '..', require('../package').main || 'index.js')],
  ],
}
