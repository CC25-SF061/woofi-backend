import jwt from '@hapi/jwt';
import { getDatabase } from '../../core/Database.js';
import Boom from '@hapi/boom';
import errorConstant from '../../core/ErrorConstant.js';
import bcrypt from 'bcrypt';
import cookieConfig, { COOKIE_DATA_NAME } from '../../config/cookie.js';
import { accessTokenConfig, refreshTokenConfig } from '../../config/jwt.js';
import { badRequest } from '../util/errorHandler.js';
import { verify } from '../../core/GoogleOauth.js';
import { nanoid } from 'nanoid';
import OauthProvider from '../../core/OauthProvider.js';
import {
    generateAccessToken,
    generateRefreshToken,
} from '../util/generateAuthToken.js';

export class AuthController {
    constructor() {}

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async logout(request, h) {
        const db = getDatabase();
        const { credentials } = request.auth;
        await db
            .deleteFrom('token')
            .where('token.user_id', '=', credentials.id)
            .where(
                'token.refresh_token',
                '=',
                request.state[COOKIE_DATA_NAME].token
            )
            .execute();

        return h
            .response({
                success: true,
                message: 'Success logout user',
            })
            .unstate(COOKIE_DATA_NAME);
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async register(request, h) {
        try {
            const { payload } = request;
            const db = getDatabase();
            const user = await db
                .selectFrom('user')
                .selectAll()
                .where((eb) =>
                    eb.or([
                        eb('username', '=', payload.username),
                        eb('email', '=', payload.email),
                    ])
                )
                .executeTakeFirst();
            if (user?.email === payload.email) {
                return badRequest(h, 'Email Already Used', {
                    errCode: errorConstant.ERR_EMAIL_ALREADY_USED,
                });
            }
            if (user?.username === payload.username) {
                return badRequest(h, 'Username Already Used', {
                    errCode: errorConstant.ERR_USERNAME_ALREADY_USED,
                });
            }
            const insertUserObj = {
                username: payload.username,
                email: payload.email,
                name: payload.name,
            };
            const result = await db
                .insertInto('user')
                .values({
                    ...insertUserObj,
                    password: await bcrypt.hash(
                        payload.password,
                        parseInt(process.env.BCRYPT_HASH_ROUND)
                    ),
                })
                .returning(['id', 'is_verified', 'profile_image'])
                .executeTakeFirst();
            const refreshToken = generateRefreshToken(result.id.toString());
            const accessToken = generateAccessToken(result.id.toString());

            await db
                .insertInto('token')
                .values({
                    user_id: result.id,
                    refresh_token: refreshToken,
                    expired_at: new Date(
                        Date.now() + refreshTokenConfig.ttlSec * 1000
                    ).toISOString(),
                })
                .executeTakeFirst();
            h.state(COOKIE_DATA_NAME, { token: refreshToken }, cookieConfig);
            return h.response({
                success: true,
                message: 'Success creating user',
                data: {
                    ...insertUserObj,
                    profileImage: result.profile_image,
                    isVerified: result.is_verified,
                    id: result.id.toString(),
                    token: accessToken,
                },
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async login(request, h) {
        try {
            const { payload } = request;
            const db = getDatabase();
            const user = await db
                .selectFrom('user')
                .selectAll()
                .where('email', '=', payload.email)
                .where('password', 'is not', null)
                .executeTakeFirst();
            if (!user || !bcrypt.compareSync(payload.password, user.password)) {
                return badRequest(h, 'Invalid Email Or Password', {
                    errCode: errorConstant.ERR_INVALID_LOGIN,
                });
            }
            const refreshToken = generateRefreshToken(user.id.toString());
            const accessToken = generateAccessToken(user.id.toString());
            await db
                .insertInto('token')
                .values({
                    user_id: user.id,
                    refresh_token: refreshToken,
                    expired_at: new Date(
                        Date.now() + refreshTokenConfig.ttlSec * 1000
                    ).toISOString(),
                })
                .executeTakeFirst();

            h.state(COOKIE_DATA_NAME, { token: refreshToken }, cookieConfig);

            return h.response({
                message: 'Success Login user',
                success: true,
                data: {
                    profileImage: user.profile_image,
                    id: user.id.toString(),
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    isVerified: user.is_verified,
                    token: accessToken,
                },
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async refreshToken(request, h) {
        try {
            const data = request.state[COOKIE_DATA_NAME];
            const refreshToken = data?.token;

            const db = getDatabase();
            const token = await db
                .selectFrom('token')
                .select('token.user_id')
                .where('refresh_token', '=', refreshToken ?? '')
                .executeTakeFirst();
            if (!token) {
                return badRequest(h, 'Invalid token', {
                    errCode: errorConstant.ERR_INVALID_TOKEN,
                });
            }

            const accessToken = generateAccessToken(token.user_id.toString());

            return h.response({
                success: true,
                message: 'Success creating token',
                data: {
                    token: accessToken,
                },
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async googleRegister(request, h) {
        try {
            const { payload } = request;
            const googleUser = await verify(payload.token);
            if (!googleUser.email) {
                return badRequest(h, 'Email scope must be provided', {
                    errCode: errorConstant.ERR_GOOGLE_INVALID_SCOPE,
                });
            }

            const db = getDatabase();
            let user = await db
                .selectFrom('user')
                .leftJoin('oauth', (join) =>
                    join
                        .onRef('oauth.user_id', '=', 'user.id')
                        .on('oauth.provider_name', '=', OauthProvider.GOOGLE)
                )
                .where((eb) =>
                    eb.or([
                        eb('oauth.provider_user_id', '=', googleUser.userId),
                        eb('user.email', '=', googleUser.email),
                    ])
                )
                .selectAll()
                .executeTakeFirst();
            if (user?.provider_name === OauthProvider.GOOGLE) {
                return badRequest(h, 'provider already exist', {
                    errCode: errorConstant.ERR_OAUTH_PROVIDER_ALREADY_EXIST,
                });
            }

            if (!user) {
                const tempUser = await db
                    .insertInto('user')
                    .values({
                        email: googleUser.email,
                        username: nanoid(),
                        is_verified: googleUser.email_verified,
                    })
                    .returning('id')
                    .executeTakeFirst();
                const username = 'user' + tempUser.id;
                user = await db
                    .updateTable('user')
                    .set({
                        name: username,
                        username: username,
                    })
                    .where('id', '=', tempUser.id)
                    .returningAll()
                    .executeTakeFirst();
            }

            const refreshToken = generateRefreshToken(user.id.toString());
            const accessToken = generateAccessToken(user.id.toString());
            //prevent blocking process for each calling to database
            await Promise.all([
                db
                    .insertInto('token')
                    .values({
                        user_id: user.id,
                        expired_at: new Date(
                            Date.now() + refreshTokenConfig.ttlSec * 1000
                        ).toISOString(),
                        refresh_token: refreshToken,
                    })
                    .executeTakeFirst(),
                db
                    .insertInto('oauth')
                    .values({
                        user_id: user.id,
                        provider_user_id: googleUser.userId,
                        provider_name: OauthProvider.GOOGLE,
                    })
                    .executeTakeFirst(),
            ]);

            h.state(COOKIE_DATA_NAME, { token: refreshToken }, cookieConfig);

            return h.response({
                message: 'Success Register user',
                success: true,
                data: {
                    profileImage: user.profile_image,
                    id: user.id.toString(),
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    isVerified: user.is_verified,
                    token: accessToken,
                },
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async googleLogin(request, h) {
        try {
            const { payload } = request;
            const googleUser = await verify(payload.token);

            if (!googleUser.email) {
                return badRequest(h, 'Email scope must be provided', {
                    errCode: errorConstant.ERR_GOOGLE_INVALID_SCOPE,
                });
            }

            const db = getDatabase();
            let user = await db
                .selectFrom('user')
                .innerJoin('oauth', (join) =>
                    join
                        .onRef('user.id', '=', 'oauth.user_id')
                        .on('oauth.provider_name', '=', OauthProvider.GOOGLE)
                )
                .where('oauth.provider_user_id', '=', googleUser.userId)
                .selectAll()
                .executeTakeFirst();

            if (!user) {
                return badRequest(h, 'Invalid token id', {
                    errCode: errorConstant.ERR_USER_NOT_FOUND,
                });
            }

            const accessToken = generateAccessToken(user.id.toString());
            const refreshToken = generateRefreshToken(user.id.toString());
            await db
                .insertInto('token')
                .values({
                    user_id: user.id,
                    expired_at: new Date(
                        Date.now() + refreshTokenConfig.ttlSec * 1000
                    ).toISOString(),
                    refresh_token: refreshToken,
                })
                .executeTakeFirst();
            h.state(COOKIE_DATA_NAME, { token: refreshToken }, cookieConfig);

            return h.response({
                message: 'Success Login user',
                success: true,
                data: {
                    id: user.id.toString(),
                    profileImage: user.profile_image,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    isVerified: user.is_verified,
                    token: accessToken,
                },
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
