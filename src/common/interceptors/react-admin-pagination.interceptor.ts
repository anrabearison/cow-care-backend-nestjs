import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

type PaginatedBody = {
    data: unknown[];
    total: number;
    page?: number;
    perPage?: number;
    per_page?: number;
};

function isPaginatedListBody(body: unknown): body is PaginatedBody {
    if (!body || typeof body !== 'object') {
        return false;
    }
    const o = body as Record<string, unknown>;
    return Array.isArray(o.data) && typeof o.total === 'number';
}

function resourceNameFromRequest(req: Request): string {
    const path = (req.path || req.url || '').split('?')[0];
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'items';
    return String(last).replace(/-/g, '_');
}

/**
 * Sets React Admin list headers when the response body is a paginated object
 * { data: T[], total, page?, perPage? | per_page? }.
 */
@Injectable()
export class ReactAdminPaginationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const http = context.switchToHttp();
        const res = http.getResponse<Response>();
        const req = http.getRequest<Request>();

        return next.handle().pipe(
            map((body) => {
                if (!isPaginatedListBody(body)) {
                    return body;
                }

                const page = Number(body.page) || 1;
                const perPage = Number(body.perPage ?? body.per_page) || 10;
                const total = body.total;
                const start = (page - 1) * perPage;
                const resource = resourceNameFromRequest(req);

                let contentRange: string;
                if (total === 0) {
                    contentRange = `${resource} */0`;
                } else if (body.data.length === 0) {
                    contentRange = `${resource} ${start}-*/${total}`;
                } else {
                    const end = start + body.data.length - 1;
                    contentRange = `${resource} ${start}-${end}/${total}`;
                }

                res.setHeader('X-Total-Count', String(total));
                res.setHeader('Content-Range', contentRange);
                res.setHeader(
                    'Access-Control-Expose-Headers',
                    'Content-Range, X-Total-Count',
                );

                return body;
            }),
        );
    }
}
