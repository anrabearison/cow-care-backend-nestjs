import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);

    // Global API prefix and versioning
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // Sentry initialization
    const sentryDsn = configService.get<string>('sentry.dsn');
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            environment: configService.get<string>('app.environment'),
            tracesSampleRate: 0.1,
        });
    }

    // Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );


    // CORS Configuration
    const corsOrigins = configService.get<string[]>('cors.origins');
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
        exposedHeaders: 'Content-Range, X-Total-Count',
    });

    // Static Assets
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });

    // Swagger Configuration
    const config = new DocumentBuilder()
        .setTitle(configService.get<string>('app.name'))
        .setDescription('Ombiko Cow Care API Documentation')
        .setVersion(configService.get<string>('app.version'))
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Start Server
    const port = configService.get<number>('server.port') || 3000;
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
