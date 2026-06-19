export function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function toCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });
}

export function transformKeysToSnakeCase(data: any, visited = new WeakSet()): any {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Date) {
        return data;
    }

    if (typeof data !== 'object') {
        return data;
    }

    if (visited.has(data)) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => transformKeysToSnakeCase(item, visited));
    }

    // Mark as visited
    visited.add(data);

    const transformed: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const snakeKey = toSnakeCase(key);
            transformed[snakeKey] = transformKeysToSnakeCase(data[key], visited);
        }
    }
    return transformed;
}

export function transformKeysToCamelCase(data: any, visited = new WeakSet()): any {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Date) {
        return data;
    }

    if (typeof data !== 'object') {
        return data;
    }

    if (visited.has(data)) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => transformKeysToCamelCase(item, visited));
    }

    // Mark as visited
    visited.add(data);

    const transformed: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const camelKey = toCamelCase(key);
            transformed[camelKey] = transformKeysToCamelCase(data[key], visited);
        }
    }
    return transformed;
}
