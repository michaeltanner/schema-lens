export const BUILTIN_FORMATS: Record<string, string> = {
  'xs:dateTime': 'YYYY-MM-DDTHH:mm:ss.sssZ',
  'dateTime': 'YYYY-MM-DDTHH:mm:ss.sssZ',
  'xs:date': 'YYYY-MM-DD',
  'date': 'YYYY-MM-DD',
  'xs:time': 'HH:mm:ss',
  'time': 'HH:mm:ss',
  'xs:duration': 'PnYnMnDTnHnMnS',
  'duration': 'PnYnMnDTnHnMnS',
  'xs:boolean': 'true | false | 1 | 0',
  'boolean': 'true | false | 1 | 0',
  'xs:double': 'Decimal (e.g. 1.23)',
  'double': 'Decimal (e.g. 1.23)',
  'xs:float': 'Decimal (e.g. 1.23)',
  'float': 'Decimal (e.g. 1.23)',
  'xs:anyURI': 'URL / URI',
  'anyURI': 'URL / URI',
  'xs:base64Binary': 'Base64 encoded string',
  'base64Binary': 'Base64 encoded string',
  'xs:hexBinary': 'Hex encoded string',
  'hexBinary': 'Hex encoded string',
  'xs:string': 'String',
  'string': 'String'
};

import { isBuiltInType } from '@/core/utils/schemaUtils';

export { isBuiltInType };

export const getFormat = (typeName?: string) => {
  if (!typeName) return undefined;
  const clean = typeName.includes(':') ? typeName.split(':')[1] : typeName;
  return BUILTIN_FORMATS[typeName] || BUILTIN_FORMATS[clean] || BUILTIN_FORMATS[`xs:${clean}`];
};
