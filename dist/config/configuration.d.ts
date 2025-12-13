declare const _default: () => {
    app: {
        name: string;
        version: string;
        debug: boolean;
        environment: string;
    };
    server: {
        host: string;
        port: number;
    };
    database: {
        url: string;
        echo: boolean;
    };
    security: {
        secretKey: string;
        algorithm: string;
        accessTokenExpireMinutes: number;
        refreshTokenExpireDays: number;
    };
    cors: {
        origins: string[];
    };
    upload: {
        dir: string;
        maxSize: number;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
        folder: string;
    };
    sentry: {
        dsn: string;
    };
};
export default _default;
