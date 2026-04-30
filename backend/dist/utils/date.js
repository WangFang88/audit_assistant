"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCst = formatCst;
function formatCst(date, includeSeconds = true) {
    const offset = 8 * 60 * 60 * 1000;
    const cst = new Date(date.getTime() + offset);
    const iso = cst.toISOString();
    return includeSeconds ? iso.slice(0, 19).replace('T', ' ') : iso.slice(0, 16).replace('T', ' ');
}
//# sourceMappingURL=date.js.map