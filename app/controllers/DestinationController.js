import { getDatabase } from '../../core/Database.js';
import ErrorConstant from '../../core/ErrorConstant.js';
import { createPath, upload } from '../../core/FileUpload.js';
import Boom from '@hapi/boom';
import mime from 'mime';

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
    async getPost(request, h) {
        try {
            const { params } = request;
            const postId = parseInt(params.postId);
            const db = getDatabase();

            const destination = await db
                .selectFrom('destination')
                .leftJoin(
                    'rating_destination',
                    'rating_destination.destination_id',
                    'destination.id'
                )
                .select(({ eb }) => [
                    eb.fn.avg('rating_destination.score').as('rating'),
                    'destination.id',
                    'destination.created_at',
                    'destination.detail',
                    'destination.image',
                    'destination.location',
                    'destination.user_id',
                ])
                .where('destination.id', '=', postId)
                .groupBy('destination.id')
                .executeTakeFirst();
            if (!destination) {
                return h.response({
                    ...Boom.notFound().output,
                    errCode: ErrorConstant.ERR_NOT_FOUND,
                });
            }
            return h
                .response(
                    JSON.stringify(
                        Object.assign(
                            {
                                success: true,
                                message: 'Success get destination',
                            },
                            { data: destination }
                        ),
                        (_, value) => {
                            if (typeof value === 'bigint') {
                                return value.toString();
                            }
                            return value;
                        }
                    )
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
