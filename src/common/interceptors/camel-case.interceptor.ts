import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { transformKeysToCamelCase } from '../utils/case-transform.util';

@Injectable()
export class CamelCaseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        
        if (request.body) {
            request.body = transformKeysToCamelCase(request.body);
        }
        
        // Express v5: request.query is read-only for reassignment, but mutable for in-place changes
        // Delete existing keys and assign transformed keys to avoid "Cannot set property query" error
        if (request.query && typeof request.query === 'object') {
            const transformed = transformKeysToCamelCase(request.query);
            for (const key of Object.keys(request.query)) {
                delete request.query[key];
            }
            Object.assign(request.query, transformed);
        }

        return next.handle();
    }
}
