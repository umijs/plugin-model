import React from 'react';
import { DIR_NAME_IN_TMP } from './constants';

export function rootContainer(container: React.ReactNode) {
  return React.createElement(
    require(`@tmp/${DIR_NAME_IN_TMP}/Provider`).default,
    null,
    container
  );
}
