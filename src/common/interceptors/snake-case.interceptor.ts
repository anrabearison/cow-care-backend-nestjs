import {
    Injectable,
    NestInterceptor,
    CallHandler,
    ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { transformKeysToSnakeCase } from '../utils/case-transform.util';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => transformKeysToSnakeCase(data))
        );
    }
}
