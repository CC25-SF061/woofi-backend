import { getDatabase } from '../../core/Database.js';
import Boom from '@hapi/boom';
import ErrorConstant from '../../core/ErrorConstant.js';
import { badRequest } from '../util/errorHandler.js';
export class WhislistController {
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
    async whislist(request, h) {
        try {
            const { credentials } = request.auth;
            const { params } = request;
            const db = this.db;
            const postId = params.postId;
            const [post, whislist] = await Promise.all([
                db
                    .selectFrom('destination')
                    .where('id', '=', postId)
                    .executeTakeFirst(),
                db
                    .selectFrom('whislist')
                    .where('user_id', '=', credentials.id)
                    .where('destination_id', '=', postId)
                    .executeTakeFirst(),
            ]);

            if (!post) {
                return h.response({
                    ...Boom.notFound('Destination not found').output,
                    errCode: ErrorConstant.ERR_NOT_FOUND,
                });
            }
            if (whislist) {
                return badRequest(h, 'Whislist already exist', {
                    errCode: ErrorConstant.ERR_WHISLIST_ALREADY_EXIST,
                });
            }

            await db
                .insertInto('whislist')
                .values({
                    user_id: credentials.id,
                    destination_id: postId,
                })
                .execute();

            return h
                .response({
                    success: true,
                    message: 'Success creating wishlist',
                })
                .code(201);
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
    async deleteWhislist(request, h) {
        try {
            const { credentials } = request.auth;
            const { params } = request;
            const db = this.db;
            const postId = params.postId;
            const whislist = await db
                .selectFrom('whislist')
                .where('user_id', '=', credentials.id)
                .where('destination_id', '=', postId)
                .executeTakeFirst();

            if (!whislist) {
                return h.response({
                    ...Boom.notFound('whislist not found').output,
                    errCode: ErrorConstant.ERR_NOT_FOUND,
                });
            }

            await db
                .deleteFrom('whislist')
                .where('user_id', '=', credentials.id)
                .where('destination_id', '=', postId)
                .execute();

            return h
                .response({
                    success: true,
                    message: 'Success delete wishlist',
                })
                .code(201);
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
