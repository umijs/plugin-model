import { join } from 'path';

export default function () {
  return `
import { useState, useEffect, useContext } from 'react';
import { UmiContext } from '${join(__dirname, '..', 'helpers', 'constant')}';
import { Model } from './provider';

export const useModel = <T extends keyof Model<T>>(namespace: T) : Model<T>[T] => {
  const dispatcher = useContext<any>(UmiContext);
  const [state, setState] = useState<Model<T>[T]>(
    () => dispatcher.data![namespace] as Model<T>[T]
  );
  useEffect(() => {
    const handler = (e: any) => {
      setState(e);
    }
    try {
      dispatcher.callbacks![namespace]!.add(handler);
    } catch (e) {
      dispatcher.callbacks![namespace] = new Set();
      dispatcher.callbacks![namespace]!.add(handler);
    }
    return () => {
      dispatcher.callbacks![namespace]!.delete(handler);
    }
  }, [namespace])
  return state!;
};
`;
}
