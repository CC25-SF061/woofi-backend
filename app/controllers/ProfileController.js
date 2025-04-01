import Boom from '@hapi/boom';
import { getDatabase } from '../../core/Database.js';
import { JSONToString } from '../util/json.js';
import { badRequest } from '../util/errorHandler.js';
import ErrorConstant from '../../core/ErrorConstant.js';

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
            },
        });
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getWhislists(request, h) {
        try {
            const { credentials } = request.auth;
            const db = this.db;
            let destination = await db
                .selectFrom('whislist as w')
                .leftJoin('destination as d', 'd.id', 'w.destination_id')
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
                    'd.user_id',
                ])
                .distinct()
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success retrieve whislist',
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
                .where('user.name', '=', payload.username)
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
        }
    }
}
