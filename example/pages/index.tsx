import React from 'react';
import { useModel, Models } from 'umi';

export default () => {
  const fullRet = useModel('counter');
  const partialRet = useModel('counter', c => c.counter);

  return (
    <>
      {partialRet}
      <button onClick={fullRet.increment}>add</button>
      <button onClick={fullRet.decrement}>minus</button>
    </>
  );
};
