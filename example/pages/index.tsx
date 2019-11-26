import React from 'react';
import { useModel, Models } from 'umi';

export default () => {
  const { counter, increment, decrement } = useModel('counter');
  return (<>
    {counter}
    <button onClick={increment}>add</button>
    <button onClick={decrement}>minus</button>
  </>);
}
