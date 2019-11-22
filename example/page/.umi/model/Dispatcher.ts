import { models } from './Provider';
export default class Dispatcher<T extends keyof typeof models> {
callbacks: {
  [key in keyof typeof models]?: Set<(val: typeof models[T]) => void>
} = {};
data: {
  [key in keyof typeof models]?: typeof models[T];
} = {};
update = (namespace: T) => {
  ((this.callbacks[namespace] || []) as Array<(val: typeof models[T]) => void>)
  .forEach(callback => {
    try {
      const data = this.data[namespace] as typeof models[T];
      callback(data);
    } catch (e) {
      callback(undefined as unknown as typeof models[T]);
    }
  })
}
}
    