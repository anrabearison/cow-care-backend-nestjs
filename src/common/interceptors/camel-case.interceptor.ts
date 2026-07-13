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
        
        // Transform body keys to camelCase
        if (request.body) {
            request.body = transformKeysToCamelCase(request.body);
        }
        
        // Query param transformation is now handled by QueryCamelCasePipe
        // to ensure it works reliably with Express v5/NestJS v11

        return next.handle();
    }
}
