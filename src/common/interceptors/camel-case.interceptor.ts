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
        
        if (request.query) {
            request.query = transformKeysToCamelCase(request.query);
        }

        return next.handle();
    }
}
