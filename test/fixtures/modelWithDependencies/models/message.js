import { useState } from 'react';
import { useModel } from '../.umi/useModel';

export default () => {
  const { role } = useModel('auth');
  return role === 'admin' ? 'Hello admin' : 'Hello user';
}
