import { join } from 'path';
// need get a  index.js
// eslint-disable-next-line import/no-unresolved
import { IApi } from 'umi-types';
import { winPath } from 'umi-utils';
import { DIR_NAME_IN_TMP } from './constants';
import getProviderContent from './utils/getProviderContent';
import getUseModelContent from './utils/getUseModelContent';

export default (api: IApi) => {
  const { paths, config } = api;

  function getModelsPath() {
    return join(paths.absSrcPath, config.singular ? 'model' : 'models');
  }

  // Add provider wrapper with rootContainer
  api.addRuntimePlugin(join(winPath(__dirname), './runtime'));

  api.onGenerateFiles(() => {
    const modelsPath = getModelsPath();
    try {
      const additionalModels = api.applyPlugins('addExtraModels', {
        initialValue: [],
      });
      // Write models/provider.tsx
      api.writeTmpFile(
        `${DIR_NAME_IN_TMP}/Provider.tsx`,
        getProviderContent(modelsPath, additionalModels),
      );
      // Write models/useModel.tsx
      api.writeTmpFile(`${DIR_NAME_IN_TMP}/useModel.tsx`, getUseModelContent());
    } catch (e) {
      api.log.error(e);
    }
  });

  api.addPageWatcher(() => {
    const modelsPath = getModelsPath();
    return [modelsPath];
  });

  // Export useModel and Models from umi
  api.addUmiExports([
    {
      specifiers: ['useModel'],
      source: winPath(join(api.paths.absTmpDirPath, DIR_NAME_IN_TMP, 'useModel')),
    },
    {
      specifiers: ['Models'],
      source: winPath(join(api.paths.absTmpDirPath, DIR_NAME_IN_TMP, 'Provider')),
    },
  ]);
};
