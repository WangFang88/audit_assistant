export type LibraryType = 'regulation' | 'local_policy' | 'national_case' | 'local_case' | 'industry' | 'private';
export declare const LIBRARY_TYPES: LibraryType[];
export declare function isPublicLibrary(t: LibraryType): boolean;
