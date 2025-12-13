"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSnakeCase = toSnakeCase;
exports.transformKeysToSnakeCase = transformKeysToSnakeCase;
function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
function transformKeysToSnakeCase(data) {
    if (data === null || data === undefined) {
        return data;
    }
    if (data instanceof Date) {
        return data;
    }
    if (typeof data === 'string' && /^[A-Z_]+$/.test(data)) {
        return data.toLowerCase();
    }
    if (Array.isArray(data)) {
        return data.map(item => transformKeysToSnakeCase(item));
    }
    if (typeof data === 'object') {
        const plainData = JSON.parse(JSON.stringify(data));
        const transformed = {};
        for (const key in plainData) {
            if (plainData.hasOwnProperty(key)) {
                const snakeKey = toSnakeCase(key);
                transformed[snakeKey] = transformKeysToSnakeCase(plainData[key]);
            }
        }
        return transformed;
    }
    return data;
}
//# sourceMappingURL=case-transform.util.js.map