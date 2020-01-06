import path from 'path';
import { EOL } from 'os';
import { readFileSync } from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

export type ModelItem = { absPath: string; namespace: string } | string;

export const getName = (absPath: string) => {
  return path.basename(absPath, path.extname(absPath));
};
export const getPath = (absPath: string) => {
  const info = path.parse(absPath);
  return path.join(info.dir, info.name);
};

export const genImports = (imports: string[]) => {
  return imports.map((ele, index) => `import model${index} from '${getPath(ele)}';`).join(EOL);
};

export const genExtraModels = (models: ModelItem[] = []) => {
  return models.map(ele => {
    if (typeof ele === 'string') {
      return {
        importPath: getPath(ele),
        importName: getName(ele),
        namespace: getName(ele),
      };
    } else {
      return {
        importPath: getPath(ele.absPath),
        importName: getName(ele.absPath),
        namespace: ele.namespace,
      };
    }
  });
};

type HookItem = { namespace: string; use: string[] };

export const sort = (ns: HookItem[]) => {
  let final: string[] = [];
  ns.forEach((item, index) => {
    if (item.use && item.use.length) {
      const itemGroup = [...item.use, item.namespace];

      const cannotUse = [item.namespace];
      for (let i = 0; i <= index; i++) {
        if (ns[i].use.filter(v => cannotUse.includes(v)).length) {
          if (cannotUse.includes(ns[i].namespace)) {
            continue;
          } else {
            cannotUse.push(ns[i].namespace);
            i = -1;
            continue;
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
        const index = final.indexOf(intersection[0]);
        // replace with groupItem
        final = final
          .slice(0, index)
          .concat(itemGroup)
          .concat(final.slice(index + 1));
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

  const checkDuplicates = (list: string[]) => {
    return new Set(list).size !== list.length;
  };

  const raw = contents.map((ele, index) => {
    const ast = parse(ele.content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    });

    let use: string[] = [];

    traverse(ast, {
      enter(path) {
        if (path.isIdentifier({ name: 'useModel' })) {
          try {
            // string literal
            const ns = (path.parentPath.node as any).arguments[0].value;
            if(allUserModel.includes(ns)){
              use.push(ns);
            }
          } catch(e) {};
        }
      }
    });
    
    return { namespace: ele.namespace, use, importName: `model${index}` };
  });

  const models = sort(raw);

  if (checkDuplicates(contents.map(ele => ele.namespace))) {
    throw Error('umi: models 中包含重复的 namespace！');
  }
  return raw.sort((a,b) => models.indexOf(a.namespace) - models.indexOf(b.namespace));
};
