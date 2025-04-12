import Boom from '@hapi/boom';
import { getDatabase } from '../../core/Database.js';
import { JSONToString } from '../util/json.js';
import { badRequest } from '../util/errorHandler.js';
import ErrorConstant from '../../core/ErrorConstant.js';
import { sql } from 'kysely';
import { createPath, upload } from '../../core/FileUpload.js';
import mime from 'mime';
import bcrypt from 'bcrypt';
import { transport } from '../../core/Mailer.js';
import { createStringUser, getEnforcer } from '../../core/rbac/Casbin.js';

export class ProfileController {
    /**@type {ReturnType<typeof getDatabase>} */
    db;
    constructor() {
        this.db = getDatabase();
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getProfile(request, h) {
        const enforcer = getEnforcer();
        const { credentials } = request.auth;
        const db = this.db;

        const user = await db
            .selectFrom('user')
            .where('user.id', '=', credentials.id)
            .select([
                'id',
                'email',
                'is_verified',
                'name',
                'username',
                'profile_image',
                'is_new_user',
            ])
            .executeTakeFirst();
        JSON.stringify(
            {
                success: true,
                message: 'Success getting profile',
                data: user,
            },
            (_, val) => {
                if (typeof val === 'bigint') {
                    return val.toString();
                }

                return val;
            }
        );

        return h.response({
            success: true,
            message: 'Success getting profile',
            data: {
                id: user.id.toString(),
                profileImage: user.profile_image,
                username: user.username,
                email: user.email,
                name: user.name,
                isVerified: user.is_verified,
                isAdmin: await enforcer.enforce(
                    createStringUser(user.id),
                    '*',
                    'admin'
                ),
                isNewUser: user.is_new_user,
            },
        });
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getWishlist(request, h) {
        try {
            const { credentials } = request.auth;
            const db = this.db;
            let destination = await db
                .selectFrom('wishlist as w')
                .innerJoin('destination as d', (join) =>
                    join.onRef('w.destination_id', '=', 'd.id')
                )
                .where('d.deleted_at', 'is', null)
                .leftJoin(
                    'rating_destination as rd',
                    'd.id',
                    'rd.destination_id'
                )
                .where('w.user_id', '=', credentials.id)
                .select((eb) => [
                    eb.fn
                        .avg('rd.score')
                        .over((ob) => ob.partitionBy('d.id'))
                        .as('rating'),
                    'd.id',
                    'd.created_at',
                    'd.detail',
                    'd.image',
                    'd.location',
                    'd.name',
                ])
                .distinct()
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success retrieve wishlist',
                        data: destination,
                    })
                )
                .type('application/json');
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
    async editEmail(request, h) {
        try {
            const { credentials } = request.auth;
            const { payload } = request;
            const db = this.db;
            const email = await db
                .selectFrom('user')
                .where('user.email', '=', payload.email)
                .select('id')
                .executeTakeFirst();
            if (email) {
                return badRequest(h, 'Email already used', {
                    errCode: ErrorConstant.ERR_EMAIL_ALREADY_USED,
                });
            }
            await db
                .updateTable('user')
                .set({
                    email: payload.email,
                    is_verified: false,
                })
                .where('user.id', '=', credentials.id)
                .execute();

            return h
                .response({
                    success: true,
                    message: 'Success Update email',
                })
                .code(200);
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
    async editName(request, h) {
        try {
            const { credentials } = request.auth;
            const { payload } = request;
            const db = this.db;
            await db
                .updateTable('user')
                .set({
                    name: payload.name,
                })
                .where('user.id', '=', credentials.id)
                .execute();

            return h
                .response({
                    success: true,
                    message: 'Success Update name',
                })
                .code(200);
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
    async editUsername(request, h) {
        try {
            const { credentials } = request.auth;
            const { payload } = request;
            const db = this.db;
            const username = await db
                .selectFrom('user')
                .where('user.username', '=', payload.username)
                .select('id')
                .executeTakeFirst();
            if (username) {
                return badRequest(h, 'Username already exist', {
                    errCode: ErrorConstant.ERR_USERNAME_ALREADY_USED,
                });
            }
            await db
                .updateTable('user')
                .set({
                    username: payload.username,
                })
                .where('user.id', '=', credentials.id)
                .execute();

            return h
                .response({
                    success: true,
                    message: 'Success Update username',
                })
                .code(200);
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async editProfilePicture(request, h) {
        try {
            const { credentials } = request.auth;
            const { payload } = request;
            const db = this.db;

            const pathImage = createPath(
                mime.getExtension(payload.image.hapi.headers['content-type']),
                'profile'
            );
            await db
                .updateTable('user')
                .set({
                    profile_image: pathImage,
                })
                .where('user.id', '=', credentials.id)
                .execute();

            upload(
                pathImage,
                payload.image,
                mime.getExtension(payload.image.hapi.headers['content-type'])
            );
            return h
                .response({
                    success: true,
                    message: 'Success Update profile picture',
                    data: {
                        image: pathImage,
                    },
                })
                .code(202);
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
    async editPassword(request, h) {
        try {
            const { credentials } = request.auth;
            const { payload } = request;
            const db = this.db;
            const transporter = transport();
            const user = await db
                .selectFrom('user')
                .where('user.id', '=', credentials.id)
                .select(['user.password', 'user.email'])
                .executeTakeFirst();

            if (
                !user ||
                !bcrypt.compareSync(payload.oldPassword, user.password)
            ) {
                return badRequest(h, 'Invalid password', {
                    errCode: ErrorConstant.ERR_PASSWORD_INVALID,
                });
            }
            await db
                .updateTable('user')
                .set({
                    password: await bcrypt.hash(
                        payload.newPassword,
                        parseInt(process.env.BCRYPT_HASH_ROUND)
                    ),
                })
                .where('user.id', '=', credentials.id)
                .execute();

            transporter.sendMail({
                from: '"Woofi" <no-reply@woofi.com>',
                to: user.email,
                subject: 'Password Changed',
                text: 'Your password has changed recetly',
            });
            return h
                .response({
                    success: true,
                    message: 'Success Update password',
                })
                .code(200);
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
    async getDestinations(request, h) {
        try {
            const db = this.db;
            const { credentials } = request.auth;
            const destination = await db
                .selectFrom('destination')
                .where('destination.deleted_at', 'is', null)
                .leftJoin('rating_destination as rd', (join) =>
                    join.onRef('rd.destination_id', '=', 'destination.id')
                )
                .leftJoin('wishlist as w', (join) =>
                    join
                        .onRef('w.destination_id', '=', 'destination.id')
                        .on('w.user_id', '=', credentials?.id)
                )
                .select((eb) => [
                    'destination.id',
                    'destination.detail',
                    'destination.image',
                    'destination.name',
                    'destination.province',
                    'destination.location',
                    'destination.category',
                    eb.fn
                        .avg('rd.score')
                        .over((ob) => ob.partitionBy('destination.id'))
                        .as('rating'),
                    eb
                        .case()
                        .when(sql`w.id IS NOT NULL`)
                        .then(true)
                        .else(false)
                        .end()
                        .as('isWishlisted'),
                ])
                .distinct()
                .where('destination.user_id', '=', credentials.id)
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success retrieve destination',
                        data: destination,
                    })
                )
                .type('application/json');
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
    async personalData(request, h) {
        try {
            const db = this.db;
            const { payload } = request;
            const { credentials } = request.auth;
            await Promise.all([
                db
                    .updateTable('user')
                    .where('user.id', '=', credentials.id)
                    .set({
                        is_new_user: false,
                    })
                    .execute(),
                db
                    .insertInto('personal_data')
                    .values({
                        birth_date: payload.birth_date,
                        gender: payload.gender,
                        user_id: credentials.id,
                    })
                    .onConflict((oc) =>
                        oc.constraint('unique_personal_data').doNothing()
                    )
                    .execute(),
                db
                    .insertInto('personal_interest')
                    .values(
                        payload.interests.map((interest) => ({
                            user_id: credentials.id,
                            interest: interest,
                        }))
                    )
                    .onConflict((oc) =>
                        oc.constraint('unique_interest').doNothing()
                    )
                    .execute(),
            ]);

            return h.response({
                success: true,
                message: 'Success create personal data',
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
    async getNotifications(request, h) {
        try {
            const db = this.db;
            const { credentials } = request.auth;

            const notifications = await db
                .selectFrom('notification_user')
                .where('user_id', '=', credentials.id)
                .orderBy('created_at desc')
                .orderBy('is_read')
                .select([
                    'created_at',
                    'detail',
                    'is_read',
                    'id',
                    'user_id',
                    'from',
                ])
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success create personal data',
                        data: notifications,
                    })
                )
                .type('application/json');
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
    async updateNotificationRead(request, h) {
        try {
            const db = this.db;
            const { notificationIds } = request.payload;
            if (notificationIds.length === 0) {
                return h.response({
                    success: true,
                    message: 'success mark notifications as read',
                });
            }

            await db
                .updateTable('notification_user')
                .set({ is_read: true })
                .where('notification_user.id', 'in', notificationIds)
                .execute();
            return h.response({
                success: true,
                message: 'Notifications marked as read',
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
