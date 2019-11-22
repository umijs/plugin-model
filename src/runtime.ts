import React from 'react';
// @ts-ignore
import Provider from '@tmp/model/Provider';

export function rootContainer(container: React.ReactNode) {
  return React.createElement(Provider, null, container);
}
