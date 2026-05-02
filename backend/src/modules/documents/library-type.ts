export type LibraryType = 'regulation' | 'local_policy' | 'national_case' | 'local_case' | 'industry' | 'private';

export const LIBRARY_TYPES: LibraryType[] = ['regulation', 'local_policy', 'national_case', 'local_case', 'industry', 'private'];

/** 是否属于"公共类"库（非项目组私有） */
export function isPublicLibrary(t: LibraryType): boolean {
  return t !== 'private';
}
