import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { CamelCaseInterceptor } from './common/interceptors/camel-case.interceptor';
import { ReactAdminPaginationInterceptor } from './common/interceptors/react-admin-pagination.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { QueryCamelCasePipe } from './common/pipes/query-camel-case.pipe';

/**
 * Shared HTTP bootstrap for production (main.ts) and e2e tests.
 * Keeps pipes, versioning, and interceptors aligned.
 */
export function configureApp(app: INestApplication): void {
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    app.useGlobalPipes(
        new QueryCamelCasePipe(),
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    app.useGlobalInterceptors(
        new CamelCaseInterceptor(),
        new ReactAdminPaginationInterceptor(),
    );

    app.useGlobalFilters(new AllExceptionsFilter());
}
