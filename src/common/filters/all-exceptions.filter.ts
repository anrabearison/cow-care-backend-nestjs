import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Logger,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        // Handle Multer file size error explicitly to return a clear HTTP status
        // MulterError may not be an HttpException, so map it here
        const anyEx = exception as any;
        if (anyEx && (anyEx.code === 'LIMIT_FILE_SIZE' || anyEx.name === 'MulterError')) {
            response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
                statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
                message: 'Uploaded file is too large',
                path: request.url,
            });
            return;
        }

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

        if (exception instanceof QueryFailedError) {
            const driverError = exception.driverError;
            const code = driverError?.code;
            let status = HttpStatus.BAD_REQUEST;
            let message = `Database query failed: ${exception.message}`;

            if (code === '23505') {
                status = HttpStatus.CONFLICT;
                message = 'A record with this unique value already exists.';
            } else if (code === '23503') {
                status = HttpStatus.BAD_REQUEST;
                message = 'Cannot perform this action because a related record does not exist or is still referenced.';
            } else if (code === '23502') {
                status = HttpStatus.BAD_REQUEST;
                message = `A required database field is missing. Column: ${driverError?.column || 'unknown'}`;
            }

            this.logger.warn(
                `Database Exception [${code}]: ${exception.message} - Path: ${request.url}`
            );

            response.status(status).json({
                statusCode: status,
                message: message,
                path: request.url,
            });
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
