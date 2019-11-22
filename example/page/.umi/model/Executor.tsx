import React from 'react';
import { models } from './Provider';

interface ExecutorProps<T extends keyof typeof models> {
hook: () => typeof models[T];
onUpdate : (data: typeof models[T]) => void;
}

export default <T extends keyof typeof models>(props: ExecutorProps<T>) => {
const { hook, onUpdate } = props;
const data = hook();
onUpdate(data);
return <></>;
};
    