import chokidar from 'chokidar';
import rimraf from 'rimraf';
import { join, extname, isAbsolute } from "path";
import { genImports, genModels } from './utils';

// 监听器
const watcher = chokidar.watch('**/models/**/*.@(ts|js|tsx|jsx)', {
  ignored: ['**/node_modules/**', '**/.umi/**'],
});
let files: string[] = [];
let typescript = '';
let lastLan = 'js';

// 新增 model
export const addModel = (absPath: string, namespace?: string) => {
  watcher.add(absPath);
}

export const removeModel = (absPath: string, namespace?: string) => {
  watcher.unwatch(absPath);
}

export default (api) => {
  const { cwd } = api;

  // 修改 rootContainer
  api.addRuntimePlugin(join(__dirname, './runtime'));

  // 写 provider 方法
  const writeProvider = (files: string[], ts: string) => {

    const imports = genImports(files);

    let sortedModels: string[] = [];
    try{
      sortedModels = genModels(files);
    } catch(e) {
      api.log.error(e);
    }

    const models = `{${sortedModels.map(ele => ele).join(', ')}}`

    api.writeTmpFile(ts ? 'model/Provider.tsx' : 'model/Provider.jsx', `import React from 'react';
${imports}
import Dispatcher from './Dispatcher';
import Executor from './Executor';
import { UmiContext } from './Constant';

export const models = ${models}

${ts && `export type Model<T extends keyof typeof models> = {
  [key in keyof typeof models]: ReturnType<typeof models[T]>;
};

export type Models<T extends keyof typeof models> = Model<T>[T]`}

const dispatcher = new Dispatcher${ts && `<keyof typeof models>`}();

export default ({ children }${ts && `: { children: React.ReactNode }`}) => {

  return (
    <UmiContext.Provider value={dispatcher}>
      {
        Object.entries(models).map(pair => (
          <Executor${ts && `<keyof typeof models>`} key={pair[0]} hook={pair[1]${typescript && ` as any`}} onUpdate={val => {
            const [ns] = pair${ts && ` as [keyof typeof models, any]`};
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

  // 写帮助文件方法
  const writeHelperFiles = (ts: string) => {
    lastLan = ts ? 'ts' : 'js';
    api.writeTmpFile(ts ? 'model/Constant.ts' : 'model/Constant.js', `import React from 'react';
import Dispatcher from './Dispatcher';
import { models } from './Provider';
export const UmiContext = React.createContext${ts && `<Partial<Dispatcher<keyof typeof models>>>`}({});
    `);
    api.writeTmpFile(ts ? 'model/Dispatcher.ts' : 'model/Dispatcher.js', `import { models } from './Provider';
export default class Dispatcher${ts && `<T extends keyof typeof models>`} {
callbacks${ts && `: {
  [key in keyof typeof models]?: Set<(val: typeof models[T]) => void>
}`} = {};
data${ts && `: {
  [key in keyof typeof models]?: typeof models[T];
}`} = {};
update = (namespace${ts && `: T`}) => {
  ${ts && `(`}(this.callbacks[namespace] || [])${ts && ` as Array<(val: typeof models[T]) => void>)`}
  .forEach(callback => {
    try {
      const data = this.data[namespace]${ts && ` as typeof models[T]`};
      callback(data);
    } catch (e) {
      callback(undefined${ts && ` as unknown as typeof models[T]`});
    }
  })
}
}
    `);
    api.writeTmpFile(ts ? 'model/Executor.tsx' : 'model/Executor.jsx', `import React from 'react';
import { models } from './Provider';

${ts && `interface ExecutorProps<T extends keyof typeof models> {
hook: () => typeof models[T];
onUpdate : (data: typeof models[T]) => void;
}`}

export default ${ts && `<T extends keyof typeof models>`}(props${ts && `: ExecutorProps<T>`}) => {
const { hook, onUpdate } = props;
const data = hook();
onUpdate(data);
return <></>;
};
    `);

    api.writeTmpFile(ts ? 'model/useModel.ts' : 'model/useModel.js', `import { useState, useEffect, useContext } from 'react';
import { UmiContext } from './Constant';
import { Model } from './Provider';
export const useModel = ${ts && `<T extends keyof Model<T>>`}(namespace${ts && `: T`})${ts && ` : Model<T>[T] `}=> {
const dispatcher = useContext(UmiContext);
const [state, setState] = useState${ts && `<Model<T>[T]>`}(
  () => dispatcher.data${ts && `!`}[namespace]${ts && ` as Model<T>[T]`}
);
useEffect(() => {
  const handler = (e${ts && `: any`}) => {
    setState(e);
  }
  try {
    dispatcher.callbacks${ts && `!`}[namespace]${ts && `!`}.add(handler);
  } catch (e) {
    dispatcher.callbacks${ts && `!`}[namespace] = new Set();
    dispatcher.callbacks${ts && `!`}[namespace]${ts && `!`}.add(handler);
  }
  return () => {
    dispatcher.callbacks${ts && `!`}[namespace]${ts && `!`}.delete(handler);
  }
}, [namespace])
return state${ts && `!`};
};
`)
  }

  watcher.on('all', (event, path) => {
    if(event === 'add') {
      const ext = extname(path);
      if(ext.toLowerCase() === '.ts' || ext.toLowerCase() === '.tsx'){
        typescript = 'true';
      }
      if(isAbsolute(path)){
        files.push(path);
      } else {
        files.push(join(cwd,path));
      }
    } else if (event === 'unlink') {
      const unlinkedFile = isAbsolute(path) ? path : join(cwd, path)
      files = files.filter(ele => ele !== unlinkedFile);
      if(files.length && files.every(ele => extname(ele).toLowerCase() === '.js' || extname(ele).toLowerCase() === '.jsx')) {
        typescript = '';
      }
    }
    writeProvider(files, typescript);
    const currentLan = typescript ? 'ts' : 'js';
    if(currentLan !== lastLan) {
      lastLan = currentLan;
      rimraf.sync(join(api.paths.absTmpDirPath, 'model'));
      writeHelperFiles(typescript);
      writeProvider(files, typescript);
    }
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
