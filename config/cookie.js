/**
 * @type {import("@hapi/hapi").ServerStateCookieOptions}
 */
export default {
    ttl:  60 * 60 * 24 * 15,
    isHttpOnly: true,
    encoding: 'base64json',
    clearInvalid: true,
    strictHeader: true,
    isSameSite: 'Lax',
}

export const COOKIE_DATA_NAME = 'data';