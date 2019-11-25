import chokidar from 'chokidar';
import { join, isAbsolute } from "path";
import { IApi } from 'umi-types';
import { genImports, genModels } from './utils';

// 监听器
const watcher = chokidar.watch('**/models/**/*.@(ts|js|tsx|jsx)', {
  ignored: ['**/node_modules/**', '**/.umi/**'],
});
let files: string[] = [];

// 新增 model
export const addModel = (absPath: string, namespace?: string) => {
  watcher.add(absPath);
}

export const removeModel = (absPath: string, namespace?: string) => {
  watcher.unwatch(absPath);
}

export default (api: IApi) => {
  const { cwd } = api;

  // 修改 rootContainer
  api.addRuntimePlugin(join(__dirname, './runtime'));

  // 写 provider 的方法
  const writeProvider = (files: string[]) => {

    const imports = genImports(files);

    let sortedModels: string[] = [];
    try{
      sortedModels = genModels(files);
    } catch(e) {
      api.log.error(e);
    }

    const models = `{${sortedModels.map(ele => ele).join(', ')}}`

    api.writeTmpFile('model/Provider.tsx', `import React from 'react';
${imports}
import Dispatcher from '${join(__dirname, 'helpers', 'dispatcher')}';
import Executor from '${join(__dirname, 'helpers', 'executor')}';
import { UmiContext } from '${join(__dirname, 'helpers', 'constant')}';

export const models = ${models}

export type Model<T extends keyof typeof models> = {
  [key in keyof typeof models]: ReturnType<typeof models[T]>;
};

export type Models<T extends keyof typeof models> = Model<T>[T]

const dispatcher = new Dispatcher!();
const Exe = Executor!;

export default ({ children }: { children: React.ReactNode }) => {

  return (
    <UmiContext.Provider value={dispatcher}>
      {
        Object.entries(models).map(pair => (
          <Exe key={pair[0]} hook={pair[1] as any} onUpdate={(val: any) => {
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
`);
  }

  // 写 useModel 文件
  const writeModel = () => {
    const file = `
import { useState, useEffect, useContext } from 'react';
import { UmiContext } from '${join(__dirname, 'helpers', 'constant')}';
import { Model } from './Provider';

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
`
    api.writeTmpFile('model/useModel.tsx', file)
  };

  writeModel();

  watcher.on('all', (event, path) => {
    if(event === 'add') {
      if(isAbsolute(path)){
        files.push(path);
      } else {
        files.push(join(cwd,path));
      }
    } else if (event === 'unlink') {
      const unlinkedFile = isAbsolute(path) ? path : join(cwd, path)
      files = files.filter(ele => ele !== unlinkedFile);
    }

    // 监听文件变化时，重新生成 Provider 文件
    writeProvider(files);
  })

  const exportContent = `export { Models } from '${join(api.paths.absTmpDirPath, 'model', 'Provider')}';
export { useModel } from '${join(api.paths.absTmpDirPath, 'model', 'useModel')}';`;

  // 写 ts 类型，因为 Models 是纯 TS 类型，不能用 addUmiExports 导出，否则在 js 文件中会报错
  api.writeTmpFile('umiExports.d.ts', exportContent);

  // 写 js export
  api.addUmiExports([
    {
      specifiers: ['useModel'],
      source: join(api.paths.absTmpDirPath, 'model', 'useModel'),
    }
  ])

};
