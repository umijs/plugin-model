import { join } from 'path';
import { winPath } from 'umi-utils';

export default function() {
  return `import { useState, useEffect, useContext, useRef } from 'react';
import isEqual from '${winPath(require.resolve('lodash.isequal'))}';
import { UmiContext } from '${winPath(join(__dirname, '..', 'helpers', 'constant'))}';
import { Model } from './provider';

export function useModel<T extends keyof Model<T>>(model: T): Model<T>[T]
export function useModel<T extends keyof Model<T>, U>(model: T, selector: (model: Model<T>[T]) => U): U

export function useModel<T extends keyof Model<T>, U>(
  namespace: T, 
  updater?: (model: Model<T>[T]) => U
) : typeof updater extends undefined ? Model<T>[T] : ReturnType<NonNullable<typeof updater>>{

  type RetState = typeof updater extends undefined ? Model<T>[T] : ReturnType<NonNullable<typeof updater>>
  const dispatcher = useContext<any>(UmiContext);
  const updaterRef = useRef(updater);
  updaterRef.current = updater;
  const [state, setState] = useState<RetState>(
    () => updaterRef.current ? updaterRef.current(dispatcher.data![namespace]) : dispatcher.data![namespace]
  );

  useEffect(() => {
    const handler = (e: any) => {
      if(updater && updaterRef.current){
        const ret = updaterRef.current(e);
        if(!isEqual(ret, state)){
          setState(ret);
        }
      } else {
        setState(e);
      }
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
  }, [namespace]);

  return state;
};
`;
}
