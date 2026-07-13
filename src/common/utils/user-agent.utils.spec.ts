import { parseUserAgent } from './user-agent.utils';

describe('user-agent.utils', () => {
    describe('parseUserAgent', () => {
        it('should return Unknown for null or undefined', () => {
            expect(parseUserAgent(null)).toEqual({
                browser: 'Unknown',
                os: 'Unknown',
                deviceName: 'Unknown Device',
            });
            expect(parseUserAgent(undefined)).toEqual({
                browser: 'Unknown',
                os: 'Unknown',
                deviceName: 'Unknown Device',
            });
            expect(parseUserAgent('')).toEqual({
                browser: 'Unknown',
                os: 'Unknown',
                deviceName: 'Unknown Device',
            });
        });

        it('should parse Chrome on Windows Desktop', () => {
            const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            expect(parseUserAgent(ua)).toEqual({
                browser: 'Chrome',
                os: 'Windows',
                deviceName: 'Desktop',
            });
        });

        it('should parse Safari on macOS', () => {
            const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15';
            expect(parseUserAgent(ua)).toEqual({
                browser: 'Safari',
                os: 'macOS',
                deviceName: 'Desktop',
            });
        });

        it('should parse Firefox on Linux', () => {
            const ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0';
            expect(parseUserAgent(ua)).toEqual({
                browser: 'Firefox',
                os: 'Linux',
                deviceName: 'Desktop',
            });
        });

        it('should parse Chrome on Android Mobile', () => {
            const ua = 'Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36';
            expect(parseUserAgent(ua)).toEqual({
                browser: 'Chrome',
                os: 'Android',
                deviceName: 'Mobile',
            });
        });

        it('should parse Safari on iOS (iPhone)', () => {
            const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
            expect(parseUserAgent(ua)).toEqual({
                browser: 'Safari',
                os: 'iOS',
                deviceName: 'Mobile',
            });
        });

        it('should parse Edge on Windows', () => {
            const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
            expect(parseUserAgent(ua)).toEqual({
                browser: 'Edge',
                os: 'Windows',
                deviceName: 'Desktop',
            });
        });
    });
});
