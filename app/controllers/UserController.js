import { getDatabase } from '../../core/Database.js';
import Boom from '@hapi/boom';
import ErrorConstant from '../../core/ErrorConstant.js';
import { badRequest, notFound } from '../util/errorHandler.js';
import { JSONToString } from '../util/json.js';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { sql } from 'kysely';
export class UserController {
    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getUserData(request, h) {
        try {
            const db = getDatabase();
            const { userId } = request.params;

            const { credentials } = request.auth;
            const user = await db
                .selectFrom('user')
                .where('user.id', '=', userId)
                .leftJoin('destination as d', 'd.user_id', 'user.id')
                .select((eb) => [
                    'user.id',
                    'user.name',
                    'user.username',
                    'user.profile_image',
                    jsonArrayFrom(
                        eb
                            .selectFrom((eb) =>
                                eb
                                    .selectFrom('destination')
                                    .where('deleted_at', 'is', null)
                                    .leftJoin(
                                        'rating_destination as rd',
                                        (join) =>
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
                                            .on(
                                                'w.user_id',
                                                '=',
                                                credentials?.id
                                            )
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
                                            .over((ob) =>
                                                ob.partitionBy('destination.id')
                                            )
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
                                    .where('destination.user_id', '=', userId)
                            )
                            .selectAll()
                    ).as('destinations'),
                ])
                .executeTakeFirst();
            if (!user) {
                return notFound(h);
            }
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success get user data',
                        data: user,
                    })
                )
                .type('application/json')
                .code(200);
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
