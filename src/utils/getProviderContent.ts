import { join } from 'path';
import globby from 'globby';
import { EOL } from 'os';
import { genImports, genModels, genExtraModels, ModelItem } from './index';

function getFiles(cwd: string) {
  return globby.sync('./**/*.{ts,tsx,js,jsx}', {
    cwd
  })
    .filter(
      (file: string) =>
        !file.endsWith('.d.ts') &&
        !file.endsWith('.test.js') &&
        !file.endsWith('.test.jsx') &&
        !file.endsWith('.test.ts') &&
        !file.endsWith('.test.tsx'),
    );
}

function getModels(files: string[]) {
  const sortedModels: string[] = genModels(files);
  return sortedModels.map(ele => ele).join(', ');
}

function getExtraModels(models: ModelItem[] = []){
  const extraModels = genExtraModels(models);
  return extraModels.map(ele => `'${ele.namespace}': ${ele.importName}`).join(', ');
}

function getExtraImports(models: ModelItem[] = []){
  const extraModels = genExtraModels(models);
  return extraModels.map(ele => `import ${ele.importName} from '${ele.importPath}';`).join(EOL);
}

export default function (modelsDir: string, extra: ModelItem[] = []) {
  const files = getFiles(modelsDir).map(file => {
    return join(modelsDir, file);
  });
  const imports = genImports(files);
  const models = getModels(files);
  const extraModels = getExtraModels(extra);
  const extraImports = getExtraImports(extra);

  return `import React from 'react';
${extraImports}
${imports}
import Dispatcher from '${join(__dirname, '..', 'helpers', 'dispatcher')}';
import Executor from '${join(__dirname, '..', 'helpers', 'executor')}';
import { UmiContext } from '${join(__dirname, '..', 'helpers', 'constant')}';

export const models = { ${extraModels ? `${extraModels}, ` : ''} ${models} };

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
          <Exe key={pair[0]} namespace={pair[0]} hook={pair[1] as any} onUpdate={(val: any) => {
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
`;
}
