import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { configureApp } from './bootstrap-app';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);

    configureApp(app);

    // Cookie parser middleware - must be registered before routes
    app.use(cookieParser());

    // Sentry initialization
    const sentryDsn = configService.get<string>('sentry.dsn');
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            environment: configService.get<string>('app.environment'),
            tracesSampleRate: 0.1,
        });
    }

    // CORS Configuration
    const corsOriginsRaw = process.env.CORS_ORIGINS || '';
    const configuredOrigins = corsOriginsRaw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    const defaultAllowedOrigins = [
        'https://ankijaniko.vercel.app',
        'http://localhost:5173',
        'http://localhost:8085',
        'http://localhost:3000',
    ];

    const allowedOrigins = Array.from(
        new Set([...configuredOrigins, ...defaultAllowedOrigins])
    );

    app.enableCors({
        origin: (requestOrigin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, server-to-server)
            if (!requestOrigin) {
                return callback(null, true);
            }

            // Check if origin matches allowed list, wildcard '*', or vercel preview domains (*.vercel.app)
            const isExplicitlyAllowed = allowedOrigins.includes(requestOrigin);
            const isWildcardAllowed = configuredOrigins.includes('*');
            const isVercelDomain = /\.vercel\.app$/.test(requestOrigin);

            if (isExplicitlyAllowed || isWildcardAllowed || isVercelDomain) {
                return callback(null, true);
            }

            callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, X-CSRF-Token',
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
        .addApiKey({ type: 'apiKey', name: 'X-CSRF-Token', in: 'header' }, 'csrf')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Start Server
    // Render uses PORT environment variable, fallback to configured port or 3000
    const port = process.env.PORT || configService.get<number>('server.port') || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
