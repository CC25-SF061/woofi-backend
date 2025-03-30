import { sql } from 'kysely';
import { getDatabase } from '../../core/Database.js';
import ErrorConstant from '../../core/ErrorConstant.js';
import { createPath, upload } from '../../core/FileUpload.js';
import Boom from '@hapi/boom';
import mime from 'mime';
import { JSONToString } from '../util/json.js';

export class DestinationController {
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
    async addPost(request, h) {
        try {
            const { payload } = request;
            const { credentials } = request.auth;

            const db = this.db;

            const pathImage = createPath(
                mime.getExtension(payload.image.hapi.headers['content-type']),
                'images'
            );
            const readImage = new Promise((resolve, reject) => {
                const buffer = [];

                const stream = payload.image;
                stream.on('data', (data) => {
                    buffer.push(data);
                });
                stream.on('error', (err) => {
                    reject(err);
                });
                stream.on('end', () => {
                    resolve(Buffer.concat(buffer));
                    stream.destroy();
                });
            });
            upload(pathImage, await readImage);

            const destination = await db
                .insertInto('destination')
                .values({
                    name: payload.name,
                    user_id: credentials.id,
                    detail: payload.detail,
                    location: payload.location,
                    image: pathImage,
                    province: payload.province,
                })
                .returning(['id'])
                .executeTakeFirst();
            return h.response({
                success: true,
                message: 'Success creating destination',
                data: {
                    postId: destination.id.toString(),
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
    async getDetailPost(request, h) {
        try {
            const postId = parseInt(params.postId);
            const { credentials } = request.auth;
            const db = getDatabase();

            let destination = db
                .selectFrom('destination')
                .leftJoin(
                    'rating_destination',
                    'rating_destination.destination_id',
                    'destination.id'
                )
                .leftJoin('whislist as w', (join) =>
                    join
                        .onRef('w.destination_id', '=', 'destination.id')
                        .on('w.user_id', '=', credentials.id)
                )
                .leftJoin('rating_destination as rd2', (join) =>
                    join
                        .onRef('rd2.destination_id', '=', 'destination.id')
                        .on('rd2.user_id', '=', credentials.id)
                )
                .select(({ eb }) => [
                    eb.fn
                        .avg('rating_destination.score')
                        .over((ob) => ob.partitionBy('destination.id'))
                        .as('rating'),
                    'rd2.score as personalRating',
                    eb
                        .case()
                        .when(sql`w.id IS NOT NULL`)
                        .then('true')
                        .else(false)
                        .end()
                        .as('isWishlisted'),
                    'destination.id',
                    'destination.created_at',
                    'destination.detail',
                    'destination.image',
                    'destination.location',
                    'destination.user_id',
                ])
                .where('destination.id', '=', postId);
            // .executeTakeFirst();

            if (!destination) {
                return h.response({
                    ...Boom.notFound().output,
                    errCode: ErrorConstant.ERR_NOT_FOUND,
                });
            }
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success get destination',
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
    async getPosts(request, h) {
        try {
            const { query } = request;
            const db = getDatabase();
            const { credentials } = request.auth;
            let destination = db
                .selectFrom('destination')
                .leftJoin('rating_destination as rd', (join) =>
                    join.onRef('rd.destination_id', '=', 'destination.id')
                )
                .leftJoin('whislist as w', (join) =>
                    join
                        .onRef('w.destination_id', '=', 'destination.id')
                        .on('w.user_id', '=', credentials?.id)
                )
                .select((eb) => [
                    'destination.id',
                    'destination.detail',
                    'destination.image',
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
                .distinct();
            if (query.province) {
                destination = destination.where(
                    'destination.province',
                    '=',
                    query.province
                );
            }
            if (query.name) {
                destination = destination.where(
                    'destination.name',
                    'like',
                    `${query.name}%`
                );
            }
            const limit = 30;
            destination = await destination
                .offset(query.page * limit)
                .limit(30)
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success getting list of destination',
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
    async addRating(request, h) {
        try {
            const { payload, params } = request;
            const { credentials } = request.auth;
            const db = this.db;
            const destination = await db
                .selectFrom('destination')
                .where('id', '=', params.postId)
                .executeTakeFirst();

            if (!destination) {
                return h.response({
                    ...Boom.notFound().output,
                    errCode: ErrorConstant.ERR_NOT_FOUND,
                });
            }
            await db
                .insertInto('rating_destination')
                .values({
                    user_id: credentials.id,
                    destination_id: params.postId,
                    score: payload.score,
                })
                .onConflict((oc) =>
                    oc.column('user_id').doUpdateSet({
                        score: payload.score,
                    })
                )
                .executeTakeFirst();

            return h
                .response({
                    success: true,
                    message: 'Success rating destination',
                })
                .code(201);
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
