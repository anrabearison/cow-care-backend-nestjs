export interface ParsedUserAgent {
    browser: string;
    os: string;
    deviceName: string;
}

export function parseUserAgent(userAgent: string | undefined | null): ParsedUserAgent {
    const result: ParsedUserAgent = {
        browser: 'Unknown',
        os: 'Unknown',
        deviceName: 'Unknown Device',
    };

    if (!userAgent) {
        return result;
    }

    const ua = userAgent.toLowerCase();

    // OS parsing
    if (ua.includes('windows')) {
        result.os = 'Windows';
    } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        result.os = 'iOS';
    } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
        result.os = 'macOS';
    } else if (ua.includes('android')) {
        result.os = 'Android';
    } else if (ua.includes('linux')) {
        result.os = 'Linux';
    }

    // Browser parsing
    if (ua.includes('edg/') || ua.includes('edge/')) {
        result.browser = 'Edge';
    } else if (ua.includes('brave')) {
        result.browser = 'Brave';
    } else if (ua.includes('opr/') || ua.includes('opera')) {
        result.browser = 'Opera';
    } else if (ua.includes('firefox') || ua.includes('fxios')) {
        result.browser = 'Firefox';
    } else if (ua.includes('chrome') || ua.includes('crios')) {
        result.browser = 'Chrome';
    } else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios')) {
        result.browser = 'Safari';
    }

    // Device Type parsing
    if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
        if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobi'))) {
            result.deviceName = 'Tablet';
        } else {
            result.deviceName = 'Mobile';
        }
    } else {
        result.deviceName = 'Desktop';
    }

    return result;
}
