import path from 'path';
import { EOL } from 'os';
import { readFileSync } from 'fs';

const getName = (absPath: string) => {
  return path.basename(absPath, path.extname(absPath));
}
const getPath = (absPath: string) => {
  const info = path.parse(absPath);
  return path.join(info.dir, info.name);
}

export const genImports = (imports: string[]) => {
  return imports.map(ele => (`import ${getName(ele)} from '${getPath(ele)}';`)).join(EOL);
}

type HookItem = { namespace: string, use: string[]};

const sort = (ns: HookItem[]) => {
  let final: string[] = [];
  ns.forEach(item => {
    if (item.use && item.use.length) {
      const itemGroup = [...item.use, item.namespace];
      const intersection = final.filter(v => itemGroup.includes(v));
      if (intersection.length) {
        // first intersection
        const index = final.indexOf(intersection[0]);
        // replace with groupItem
        final = final.slice(0, index).concat(itemGroup).concat(final.slice(index + 1));
      } else {
        final.push(...itemGroup);
      }
    }
    if (!final.includes(item.namespace)) {
      // first occurance append to the end
      final.push(item.namespace);
    }
  })

  return [...new Set(final)];
};

export const genModels = (imports: string[]) => {
  const contents = imports.map(absPath => ({namespace: getName(absPath), content: readFileSync(absPath).toString()}));

  const checkDuplicates = (list: string[]) => {
    return new Set(list).size !== list.length 
  }

  const models = sort(contents.map(ele => {
    // const use: string[] = [];
    // 兼容 node8，不要用 lookahead
    // const useModelRegex = /(?<=useModel\()[^)]*(?=\))/;
    const useModelRegex = /(useModel\(.*?\))/gs;
    const allModels = ele.content.match(useModelRegex);
    let use: string[] = [];
    if(allModels) {
      use = allModels!.map(ele => {
        const lastQuote = ele.lastIndexOf('\'');
        const lastDoubleQuote = ele.lastIndexOf('\"');
        if(lastDoubleQuote > lastQuote) {
          const name = ele.slice(ele.indexOf('\"') + 1, lastDoubleQuote)
          return contents.findIndex(ele => ele.namespace === name) ? name : undefined;
        } else {
          const name = ele.slice(ele.indexOf('\'') + 1, lastQuote)
          return contents.findIndex(ele => ele.namespace === name) ? name : undefined;
        }
      }).filter(ele => !!ele) as string[];
    }
    return { namespace: ele.namespace, use };
  }));

  if(checkDuplicates(contents.map(ele => ele.namespace))) {
    throw Error('umi: models 中包含重复的 namespace！')
  }

  return models;
}