import path from 'path';
import { EOL } from 'os';
import { readFileSync } from 'fs';
import { winPath } from 'umi-utils';

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { Identifier, ArrowFunctionExpression } from '@babel/types';

export type ModelItem = { absPath: string; namespace: string } | string;

export const getName = (absPath: string) => path.basename(absPath, path.extname(absPath));

export const getPath = (absPath: string) => {
  const info = path.parse(absPath);
  return winPath(path.join(info.dir, info.name).replace(/'/, "'"));
};

export const genImports = (imports: string[]) =>
  imports
    .map((ele, index) => `import model${index} from "${winPath(getPath(ele))}";`)
    .join(EOL);

export const genExtraModels = (models: ModelItem[] = []) =>
  models.map(ele => {
    if (typeof ele === 'string') {
      return {
        importPath: getPath(ele),
        importName: getName(ele),
        namespace: getName(ele),
      };
    }
    return {
      importPath: getPath(ele.absPath),
      importName: getName(ele.absPath),
      namespace: ele.namespace,
    };
  });

type HookItem = { namespace: string; use: string[] };

export const sort = (ns: HookItem[]) => {
  let final: string[] = [];
  ns.forEach((item, index) => {
    if (item.use && item.use.length) {
      const itemGroup = [...item.use, item.namespace];

      const cannotUse = [item.namespace];
      for (let i = 0; i <= index; i += 1) {
        if (ns[i].use.filter(v => cannotUse.includes(v)).length) {
          if (!cannotUse.includes(ns[i].namespace)) {
            cannotUse.push(ns[i].namespace);
            i = -1;
          }
        }
      }

      const errorList = item.use.filter(v => cannotUse.includes(v));
      if (errorList.length) {
        throw Error(
          `Circular dependencies: ${item.namespace} can't use ${errorList.join(', ')}`,
        );
      }

      const intersection = final.filter(v => itemGroup.includes(v));
      if (intersection.length) {
        // first intersection
        const finalIndex = final.indexOf(intersection[0]);
        // replace with groupItem
        final = final
          .slice(0, finalIndex)
          .concat(itemGroup)
          .concat(final.slice(finalIndex + 1));
      } else {
        final.push(...itemGroup);
      }
    }
    if (!final.includes(item.namespace)) {
      // first occurance append to the end
      final.push(item.namespace);
    }
  });

  return [...new Set(final)];
};

export const genModels = (imports: string[]) => {
  const contents = imports.map(absPath => ({
    namespace: getName(absPath),
    content: readFileSync(absPath).toString(),
  }));
  const allUserModel = imports.map(getName);

  const checkDuplicates = (list: string[]) => new Set(list).size !== list.length;

  const raw = contents.map((ele, index) => {
    const ast = parse(ele.content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    const use: string[] = [];

    traverse(ast, {
      enter(astPath) {
        if (astPath.isIdentifier({ name: 'useModel' })) {
          try {
            // string literal
            const ns = (astPath.parentPath.node as any).arguments[0].value;
            if (allUserModel.includes(ns)) {
              use.push(ns);
            }
          } catch (e) {
            // console.log(e)
          }
        }
      },
    });

    return { namespace: ele.namespace, use, importName: `model${index}` };
  });

  const models = sort(raw);

  if (checkDuplicates(contents.map(ele => ele.namespace))) {
    throw Error('umi: models 中包含重复的 namespace！');
  }
  return raw.sort((a, b) => models.indexOf(a.namespace) - models.indexOf(b.namespace));
};

export const isValidHook = (filePath: string) => {
  const ast = parse(readFileSync(filePath, { encoding: 'utf-8'}).toString(), {
    sourceType: "module",
    plugins: ["jsx", "typescript"]
  });
  let isValidHook = false;
  let identifierName = '';
  traverse(ast, {
    enter(path) {
      if (path.isExportDefaultDeclaration()) {
        const { type } = path.node.declaration;
        try {
          if(
            type === 'ArrowFunctionExpression' ||
            type === 'FunctionDeclaration'
          ) {
            isValidHook = true;
          } else if ( type === 'Identifier' ) {
            identifierName = (path.node.declaration as Identifier).name;
          }
        } catch(e) {};
      }
    }
  });

  try{
    if(identifierName) {
      ast.program.body.forEach(ele => {
        if(ele.type === 'FunctionDeclaration') {
          if(ele.id?.name === identifierName) {
            isValidHook = true;
          }
        }
        if(ele.type === 'VariableDeclaration') {
          if((ele.declarations[0].id as Identifier).name === identifierName &&
            (ele.declarations[0].init as ArrowFunctionExpression).type === 'ArrowFunctionExpression') {
              isValidHook = true;
          }
        }
      })
    }
  } catch(e) {
    isValidHook = false;
  }

  return isValidHook;
}

export const getValidFiles = (files: string[], modelsDir: string) => {
  return files.map(file => {
    const filePath = path.join(modelsDir, file);
    const valid = isValidHook(filePath);
    if(valid){
      return filePath;
    }
    return '';
  }).filter(ele => !!ele) as string[];
}
