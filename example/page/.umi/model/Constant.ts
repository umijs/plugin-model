import React from 'react';
import Dispatcher from './Dispatcher';
import { models } from './Provider';
export const UmiContext = React.createContext<Partial<Dispatcher<keyof typeof models>>>({});
    