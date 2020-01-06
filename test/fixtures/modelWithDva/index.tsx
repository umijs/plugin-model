import React, { useEffect } from 'react';
import { useModel } from './.umi/useModel';

export default () => {
  const dva = useModel('dva');

  return (<>
    <h2 data-testid="dva">{`${dva}`}</h2>
  </>);
}
