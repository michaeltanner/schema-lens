export const isBuiltInType = (typeName?: string) => {
  if (!typeName) return false;
  return typeName.startsWith('xs:') || typeName.startsWith('xsd:');
};
