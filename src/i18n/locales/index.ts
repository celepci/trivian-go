import * as en from './en.json';
import * as tr from './tr.json';

type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: TObj[TKey] extends object
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & (string | number)];

export type TranslationKey = RecursiveKeyOf<typeof tr>;

export const translationEN = en;
export const translationTR = tr;
