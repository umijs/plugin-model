import React from 'react';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent } from '@testing-library/react';
import getProviderContent from "../src/utils/getProviderContent";
import getUseModelContent from "../src/utils/getUseModelContent";

const fixtures = join(__dirname, 'fixtures');

const delay = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

readdirSync(fixtures)
  .filter(file => file.charAt(0) !== '.')
  .forEach(file => {
    const fixture = join(fixtures, file);
    const tmpDir = join(fixture, '.umi');
    const providerContent = getProviderContent(join(fixture, 'models'));
    const useModelContent = getUseModelContent();
    const providerPath = join(tmpDir, 'Provider.tsx');
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir);
    }
    writeFileSync(providerPath, providerContent, 'utf-8');
    writeFileSync(join(tmpDir, 'useModel.tsx'), useModelContent, 'utf-8');

    test(file, async () => {
      const Provider = require(providerPath).default;
      const App = require(join(fixture, 'index.tsx')).default;
      const renderRet = render(
        <Provider><App /></Provider>
      );
      await require(join(fixture, 'test.ts')).default({
        ...renderRet,
        fireEvent,
        delay,
      });
    });
  });
