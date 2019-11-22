import React from 'react';
import counter from '/Users/troy/Desktop/my-npm/umi-plugin-model/example/page/models/counter';
import Dispatcher from './Dispatcher';
import Executor from './Executor';
import { UmiContext } from './Constant';

export const models = {counter}

export type Model<T extends keyof typeof models> = {
  [key in keyof typeof models]: ReturnType<typeof models[T]>;
};

export type Models<T extends keyof typeof models> = Model<T>[T]

const dispatcher = new Dispatcher<keyof typeof models>();

export default ({ children }: { children: React.ReactNode }) => {

  return (
    <UmiContext.Provider value={dispatcher}>
      {
        Object.entries(models).map(pair => (
          <Executor<keyof typeof models> key={pair[0]} hook={pair[1] as any} onUpdate={val => {
            const [ns] = pair as [keyof typeof models, any];
            dispatcher.data[ns] = val;
            dispatcher.update(ns);
          }} />
        ))
      }
      {children}
    </UmiContext.Provider>
  )
}
    