import jwt from '@hapi/jwt';
import { accessTokenConfig, refreshTokenConfig } from '../../config/jwt.js';

/**
 * @param {string | number} id
 * @returns {string}
 */
export function generateAccessToken(id) {
    return jwt.token.generate(
        { id: id, iss: process.env.APP_URL },
        { key: process.env.ACCESS_TOKEN_SECRET },
        accessTokenConfig
    );
}

/**
 * @param {string | number} id
 * @returns {string}
 */
export function generateRefreshToken(id) {
    return jwt.token.generate(
        {
            id: id,
            iss: process.env.APP_URL,
        },
        {
            key: process.env.REFRESH_TOKEN_SECRET,
        },
        refreshTokenConfig
    );
}
