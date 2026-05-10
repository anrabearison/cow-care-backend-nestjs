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

export function transformKeysToSnakeCase(data: any): any {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Date) {
        return data;
    }

    // Transform enum-like strings (all uppercase with underscores) to lowercase
    if (typeof data === 'string' && /^[A-Z_]+$/.test(data)) {
        return data.toLowerCase();
    }

    if (Array.isArray(data)) {
        return data.map(item => transformKeysToSnakeCase(item));
    }

    if (typeof data === 'object') {
        // Convert to plain object if it's a class instance
        const plainData = JSON.parse(JSON.stringify(data));

        const transformed: any = {};
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

export function transformKeysToCamelCase(data: any): any {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Date) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => transformKeysToCamelCase(item));
    }

    if (typeof data === 'object') {
        const transformed: any = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const camelKey = toCamelCase(key);
                transformed[camelKey] = transformKeysToCamelCase(data[key]);
            }
        }
        return transformed;
    }

    return data;
}
