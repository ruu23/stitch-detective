import { functions } from './config';
import { httpsCallable } from 'firebase/functions';

export const invokeFunction = async <T = any, R = any>(
  functionName: string,
  data?: T
): Promise<R> => {
  const callable = httpsCallable<T, R>(functions, functionName);
  const result = await callable(data);
  return result.data;
};
