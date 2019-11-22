import { join } from 'path';

export default {
  hash: true,
  manifest: {},
  plugins: [
    ['umi-plugin-react', {
      dynamicImport: {
        webpackChunkName: true,
      },
    }],
    [join(__dirname, '..', require('../package').main || 'index.js')],
  ],
}