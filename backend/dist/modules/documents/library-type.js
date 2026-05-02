"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIBRARY_TYPES = void 0;
exports.isPublicLibrary = isPublicLibrary;
exports.LIBRARY_TYPES = ['regulation', 'local_policy', 'national_case', 'local_case', 'industry', 'private'];
function isPublicLibrary(t) {
    return t !== 'private';
}
//# sourceMappingURL=library-type.js.map