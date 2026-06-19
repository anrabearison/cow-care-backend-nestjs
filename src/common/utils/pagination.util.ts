export interface PaginationOptions {
    page?: number;
    perPage?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    perPage: number;
}

export function getPaginationOffsets(options: PaginationOptions) {
    const page = Math.max(1, options.page || 1);
    const perPage = Math.max(1, options.perPage || 10);
    const skip = (page - 1) * perPage;
    return { skip, take: perPage, page, perPage };
}

export function formatPaginatedResponse<T>(data: T[], total: number, options: PaginationOptions): PaginatedResult<T> {
    return {
        data,
        total,
        page: Number(options.page),
        perPage: Number(options.perPage),
    };
}
