/**
 * @type {import('@hapi/jwt').HapiJwt.GenerateOptions}
 */
export const accessTokenConfig = {
    ttlSec:  60 * 5
}

/**
 * @type {import('@hapi/jwt').HapiJwt.GenerateOptions}
 */
export const refreshTokenConfig = {
    ttlSec:  60 * 60 * 24 * 15
}