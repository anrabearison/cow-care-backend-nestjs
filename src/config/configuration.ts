export default () => ({
    app: {
        name: process.env.APP_NAME || 'Ombiko Cow Care API',
        version: process.env.APP_VERSION || '1.0.0',
        debug: process.env.DEBUG === 'true',
        environment: process.env.ENVIRONMENT || 'production',
    },
    server: {
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT, 10) || 3000,
    },
    database: {
        url: process.env.DATABASE_URL,
        echo: process.env.DATABASE_ECHO === 'true',
    },
    security: {
        secretKey: process.env.SECRET_KEY,
        algorithm: process.env.ALGORITHM || 'HS256',
        accessTokenExpireMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES, 10) || 30,
        refreshTokenExpireDays: parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS, 10) || 7,
    },
    cors: {
        origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
    },
    upload: {
        dir: process.env.UPLOAD_DIR || './uploads',
        maxSize: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 5242880,
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER,
    },
    sentry: {
        dsn: process.env.SENTRY_DSN,
    },
    authCookies: {
        accessTokenName: process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME || 'access_token',
        refreshTokenName: process.env.AUTH_REFRESH_TOKEN_COOKIE_NAME || 'refresh_token',
        secure: process.env.AUTH_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
        sameSite: (process.env.AUTH_COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
        domain: process.env.AUTH_COOKIE_DOMAIN,
        path: process.env.AUTH_COOKIE_PATH || '/',
        maxAge: (parseInt(process.env.AUTH_COOKIE_MAX_AGE, 10) || 30 * 60 * 1000), // 30 minutes by default
    },
});
