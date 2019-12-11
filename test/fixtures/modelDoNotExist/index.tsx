import React from 'react';
import { useModel } from './.umi/useModel';

export default () => {
  const ret = useModel('user');
  return (<>
    <h2 data-testid="error">component should not break</h2>
    <h2 data-testid="ret">{`ret is: ${ret}`}</h2>
  </>);
}
