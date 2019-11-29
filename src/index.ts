import { join } from 'path';
import { IApi } from 'umi-types';
import { DIR_NAME_IN_TMP } from './constants';
import getProviderContent from './utils/getProviderContent';
import getUserModelContent from './utils/getUserModelContent';

export default (api: IApi) => {
  const { paths, config } = api;

  function getModelsPath() {
    return join(paths.absSrcPath, config.singular ? 'model' : 'models');
  }

  // Add provider wrapper with rootContainer
  api.addRuntimePlugin(join(__dirname, './runtime'));

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
      api.writeTmpFile(`${DIR_NAME_IN_TMP}/useModel.tsx`, getUserModelContent());
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
      source: join(api.paths.absTmpDirPath, DIR_NAME_IN_TMP, 'useModel'),
    },
    {
      specifiers: ['Models'],
      source: join(api.paths.absTmpDirPath, DIR_NAME_IN_TMP, 'Provider'),
    },
  ]);
};
