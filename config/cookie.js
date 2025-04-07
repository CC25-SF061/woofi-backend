/**
 * @type {import("@hapi/hapi").ServerStateCookieOptions}
 */
export default {
    ttl: 1000 * 60 * 60 * 24 * 15,
    isHttpOnly: true,
    encoding: 'base64json',
    clearInvalid: true,
    isSecure: true,
    path: '/',

    // strictHeader: false,
    isSameSite: 'None',
};

export const COOKIE_DATA_NAME = 'data';
