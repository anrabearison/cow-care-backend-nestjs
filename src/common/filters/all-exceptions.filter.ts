import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const resBody = exception.getResponse();
            if (typeof resBody === 'object' && resBody !== null) {
                response.status(status).json(resBody);
            } else {
                response.status(status).json({
                    statusCode: status,
                    message: resBody,
                    path: request.url,
                });
            }
            return;
        }

        this.logger.error(
            `${request.method} ${request.url}`,
            exception instanceof Error ? exception.stack : String(exception),
        );
        response.status(500).json({
            statusCode: 500,
            message: 'Internal server error',
            path: request.url,
        });
    }
}
