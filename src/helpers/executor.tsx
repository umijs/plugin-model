import React from 'react';

export default (props) => {
  const { hook, onUpdate } = props;
  const data = hook();
  onUpdate(data);
  return <></>;
};
