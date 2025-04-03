import { sql } from 'kysely';
import { getDatabase } from '../../core/Database.js';
import ErrorConstant from '../../core/ErrorConstant.js';
import { createPath, deleteObject, upload } from '../../core/FileUpload.js';
import Boom from '@hapi/boom';
import mime from 'mime';
import { JSONToString } from '../util/json.js';
import {
    createStringResource,
    createStringUser,
    getEnforcer,
} from '../../core/rbac/Casbin.js';
import { permission, resource } from '../../core/RoleConstant.js';

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
            const enforcer = getEnforcer();

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

            upload(pathImage, await readImage);
            await enforcer.addPolicies([
                [
                    createStringUser(credentials.id),
                    createStringResource(resource.DESTINATION, destination.id),
                    permission.EDIT,
                ],
                [
                    createStringUser(credentials.id),
                    createStringResource(resource.DESTINATION, destination.id),
                    permission.DELETE,
                ],
            ]);
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
            const { params } = request;
            const postId = parseInt(params.postId);
            const { credentials } = request.auth;
            const db = getDatabase();

            let destination = await db
                .selectFrom('destination')
                .leftJoin(
                    'rating_destination',
                    'rating_destination.destination_id',
                    'destination.id'
                )
                .leftJoin('wishlist as w', (join) =>
                    join
                        .onRef('w.destination_id', '=', 'destination.id')
                        .on('w.user_id', '=', credentials.id)
                )
                .leftJoin('rating_destination as rd2', (join) =>
                    join
                        .onRef('rd2.destination_id', '=', 'destination.id')
                        .on('rd2.user_id', '=', credentials.id)
                )
                .leftJoin('user', 'user.id', 'destination.user_id')
                .select(({ eb }) => [
                    eb.fn
                        .avg('rating_destination.score')
                        .over((ob) => ob.partitionBy('destination.id'))
                        .as('rating'),
                    eb.fn
                        .count('rating_destination.score')
                        .over((ob) => ob.partitionBy('destination.id'))
                        .as('ratingCount'),
                    'rd2.score as personalRating',
                    eb
                        .case()
                        .when(sql`w.id IS NOT NULL`)
                        .then('true')
                        .else(false)
                        .end()
                        .as('isWishlisted'),
                    'destination.name',
                    'destination.id',
                    'destination.created_at',
                    'destination.detail',
                    'destination.image',
                    'destination.location',
                    'user.name as writer',
                ])
                .where('destination.id', '=', postId)
                .executeTakeFirst();
            if (!destination) {
                return h
                    .response({
                        ...Boom.notFound().output,
                        errCode: ErrorConstant.ERR_NOT_FOUND,
                    })
                    .code(404);
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
                    'ilike',
                    `${query.name.toLowerCase()}%`
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
                .selectAll()
                .executeTakeFirst();
            if (!destination) {
                return h
                    .response({
                        ...Boom.notFound().output,
                        errCode: ErrorConstant.ERR_NOT_FOUND,
                    })
                    .code(404);
            }
            await db
                .insertInto('rating_destination')
                .values({
                    user_id: credentials.id,
                    destination_id: params.postId,
                    score: payload.score,
                })
                .onConflict((oc) =>
                    oc.constraint('unique_rating').doUpdateSet({
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

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async editDestination(request, h) {
        try {
            const { payload, params } = request;
            const db = this.db;
            let pathImage, readImage;
            if (payload.image) {
                pathImage = createPath(
                    mime.getExtension(
                        payload.image.hapi.headers['content-type']
                    ),
                    'images'
                );
                readImage = new Promise((resolve, reject) => {
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
            }

            await db
                .updateTable('destination')
                .where('destination.id', '=', params.postId)
                .set({
                    name: payload.name,
                    detail: payload.detail,
                    location: payload.location,
                    image: pathImage,
                    province: payload.province,
                })
                .execute();

            return h.response({
                success: true,
                message: 'Success updating destination',
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
    async deleteDestination(request, h) {
        try {
            const { params } = request;
            const db = this.db;
            await Promise.all([
                db
                    .deleteFrom('rating_destination')
                    .where('destination_id', '=', params.postId)
                    .execute(),
                db
                    .deleteFrom('wishlist')
                    .where('wishlist.destination_id', '=', params.postId)
                    .execute(),
                db
                    .deleteFrom('rbac')
                    .where(
                        'rbac.v1',
                        '=',
                        createStringResource(
                            resource.DESTINATION,
                            params.postId
                        )
                    )
                    .execute(),
            ]);

            await db
                .deleteFrom('destination')
                .where('destination.id', '=', params.postId)
                .returning(['image'])
                .executeTakeFirst();

            return h.response().code(204);
        } catch (e) {
            console.log(e);
        }
    }
}
