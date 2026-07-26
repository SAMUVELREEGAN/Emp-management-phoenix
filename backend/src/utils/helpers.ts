import path from 'path';

export const getParam = (
  value: string | string[] | undefined,
): string => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value || '';
};

export const toAbsoluteUploadPath = (relativePath?: string): string => {
  if (!relativePath) {
    return '';
  }
  return path.join(process.cwd(), relativePath.replace(/^\//, ''));
};
