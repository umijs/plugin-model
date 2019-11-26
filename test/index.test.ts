import {mkdirSync, readdirSync, writeFileSync} from 'fs';
import { join } from 'path';
import getProviderContent from "../src/utils/getProviderContent";
import getUserModelContent from "../src/utils/getUserModelContent";

const fixtures = join(__dirname, 'fixtures');

readdirSync(fixtures)
  .filter(file => file.charAt(0) !== '.')
  .forEach(file => {
    const fixture = join(fixtures, file);
    const tmpDir = join(fixture, '.umi');
    const providerContent = getProviderContent(join(fixture, 'models'));
    const useModelContent = getUserModelContent();
    mkdirSync(tmpDir);
    writeFileSync(join(tmpDir, 'Provider.tsx'), providerContent, 'utf-8');
    writeFileSync(join(tmpDir, 'useModel.tsx'), useModelContent, 'utf-8');
    test(file, () => {});
  });
