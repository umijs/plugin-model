import React from 'react';
import { useModel } from './.umi/useModel';

export default () => {
  const { isAdult, name } = useModel('user', user => ({ name: user.name, isAdult: user.age > 18 }));
  return (<>
    <h2 data-testid="user">{name} is {isAdult ? 'an adult' : 'a teen'}</h2>
  </>);
}
