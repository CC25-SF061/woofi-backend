import { getDatabase } from '../../core/Database.js';
import Boom, { notFound } from '@hapi/boom';
import ErrorConstant from '../../core/ErrorConstant.js';
import { badRequest } from '../util/errorHandler.js';
export class WishlistController {
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
    async wishlist(request, h) {
        try {
            const { credentials } = request.auth;
            const { params } = request;
            const db = this.db;
            const postId = params.postId;
            const [post, wishlist] = await Promise.all([
                db
                    .selectFrom('destination')
                    .where('id', '=', postId)
                    .where('destination.deleted_at', 'is', null)
                    .executeTakeFirst(),
                db
                    .selectFrom('wishlist')
                    .where('user_id', '=', credentials.id)
                    .where('destination_id', '=', postId)
                    .executeTakeFirst(),
            ]);
            if (!post) {
                return notFound(h);
            }
            if (wishlist) {
                return badRequest(h, 'wishlist already exist', {
                    errCode: ErrorConstant.ERR_WISHLIST_ALREADY_EXIST,
                });
            }

            await db
                .insertInto('wishlist')
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
    async deletewishlist(request, h) {
        try {
            const { credentials } = request.auth;
            const { params } = request;
            const db = this.db;
            const postId = params.postId;
            const wishlist = await db
                .selectFrom('wishlist')
                .where('wishlist.user_id', '=', credentials.id)
                .where('destination_id', '=', postId)
                .innerJoin(
                    'destination',
                    'destination.id',
                    'wishlist.destination_id'
                )
                .where('destination.deleted_at', 'is', null)
                .executeTakeFirst();
            if (!wishlist) {
                return notFound(h);
            }

            await db
                .deleteFrom('wishlist')
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
