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
import { mapFilter } from '../../core/DestinationFilter.js';

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
                    category: payload.category,
                })
                .returning(['id'])
                .executeTakeFirst();

            upload(pathImage, payload.image);
            await Promise.all([
                db
                    .insertInto('notification_user')
                    .values({
                        expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
                        detail: `You have created a new destination ${payload.name}`,
                        from: 'System',
                        user_id: credentials.id,
                    })
                    .execute(),
                enforcer.addPolicies([
                    [
                        createStringUser(credentials.id),
                        createStringResource(
                            resource.DESTINATION,
                            destination.id
                        ),
                        permission.EDIT,
                    ],
                    [
                        createStringUser(credentials.id),
                        createStringResource(
                            resource.DESTINATION,
                            destination.id
                        ),
                        permission.DELETE,
                    ],
                ]),
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
                .where('deleted_at', 'is', null)
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
                    'destination.category',
                    'destination.province',
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
            const filter = mapFilter(query.filter);
            let destination = db
                .selectFrom((eb) =>
                    eb
                        .selectFrom('destination')
                        .where('deleted_at', 'is', null)
                        .leftJoin('rating_destination as rd', (join) =>
                            join.onRef(
                                'rd.destination_id',
                                '=',
                                'destination.id'
                            )
                        )
                        .leftJoin('wishlist as w', (join) =>
                            join
                                .onRef(
                                    'w.destination_id',
                                    '=',
                                    'destination.id'
                                )
                                .on('w.user_id', '=', credentials?.id)
                        )
                        .select((eb) => [
                            'destination.id',
                            'destination.detail',
                            'destination.created_at',
                            'destination.image',
                            'destination.name',
                            'destination.province',
                            'destination.user_id',
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
                        .as('result')
                )
                .selectAll();
            if (query.province) {
                destination = destination.where(
                    'result.province',
                    '=',
                    query.province
                );
            }
            if (query.name) {
                destination = destination.where(
                    'result.name',
                    'ilike',
                    `${query.name.toLowerCase()}%`
                );
            }
            if (filter.HIGHEST_RATING) {
                destination = destination.orderBy(
                    'result.rating',
                    sql`desc nulls last`
                );
            }
            if (filter.NEWEST) {
                destination = destination.orderBy('result.created_at', 'desc');
            }
            if (filter.OLDEST) {
                destination = destination.orderBy('result.created_at', 'asc');
            }
            if (filter.WRITTEN_BY_YOU) {
                destination = destination.where(
                    'result.user_id',
                    '=',
                    credentials?.id
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
                .where('deleted_at', 'is', null)
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
            let pathImage;
            if (payload.image) {
                pathImage = createPath(
                    mime.getExtension(
                        payload.image.hapi.headers['content-type']
                    ),
                    'images'
                );

                upload(pathImage, payload.image);
            }

            const destination = await db
                .updateTable('destination')
                .where('destination.deleted_at', 'is', null)
                .where('destination.id', '=', params.postId)
                .set({
                    name: payload.name,
                    detail: payload.detail,
                    location: payload.location,
                    image: pathImage,
                    province: payload.province,
                    updated_at: new Date(),
                })
                .returning([
                    'destination.name',
                    'destination.id',
                    'destination.location',
                    'destination.province',
                    'destination.detail',
                    'destination.image',
                ])
                .executeTakeFirst();

            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success updating destination',
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
    async deleteDestination(request, h) {
        try {
            const { params } = request;
            const db = this.db;
            const { credentials } = request.auth;
            const destination = await db
                .updateTable('destination')
                .set({
                    deleted_at: new Date(),
                })
                .returning('name')
                .where('destination.id', '=', params.postId)
                .executeTakeFirst();

            await db
                .insertInto('notification_user')
                .values({
                    detail: `Destination ${destination.name} has been deleted.`,
                    from: 'System',
                    user_id: credentials.id,
                    expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                })
                .execute();
            return h.response().code(204);
        } catch (e) {
            console.log(e);
        }
    }
}
