import { sql } from 'kysely';
import { getDatabase } from '../../core/Database.js';
import Boom from '@hapi/boom';
import { JSONToString } from '../util/json.js';

export class AdminController {
    constructor() {}

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getResourcesCount(_, h) {
        try {
            const db = getDatabase();
            let resource = db
                .selectFrom([
                    db
                        .selectFrom('user')
                        .select((eb) => eb.fn.count('id').as('user_count'))
                        .as('user_count'),
                    db
                        .selectFrom('destination')
                        .select((eb) =>
                            eb.fn.count('id').as('destination_count')
                        )
                        .as('destination_count'),

                    sql`(SELECT array_agg(y.year ORDER BY y.year asc) AS user_years  FROM (SELECT DISTINCT EXTRACT(YEAR FROM created_at) AS year FROM "user" u) AS y)`.as(
                        'user_years'
                    ),
                    sql`(SELECT array_agg(y.year ORDER BY y.year asc) AS destination_years FROM (SELECT DISTINCT EXTRACT(YEAR FROM created_at) AS year FROM "destination" d) AS y)`.as(
                        'destination_years'
                    ),
                ])
                .selectAll();
            resource = await resource.executeTakeFirst();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success getting resources count',
                        data: resource,
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
    async getDestinationAnalytic(request, h) {
        try {
            const { year: dateYear } = request.query;
            const year = dateYear
                ? dateYear.getFullYear()
                : new Date().getFullYear();
            const db = getDatabase();
            let resource = await db
                .selectFrom('destination')
                .where('created_at', '>=', new Date(`${year}-01-01T00:00:00Z`))
                .where('created_at', '<=', new Date(`${year}-12-31T23:59:59Z`))
                .select((eb) => [
                    sql`DATE_PART('month', created_at) AS month`,
                    eb.fn.count('id').as('count'),
                ])
                .groupBy('month')
                .orderBy('month', 'asc')
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success getting resources count',
                        data: resource,
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
    async getUserAnalytic(request, h) {
        try {
            const { year: dateYear } = request.query;
            const year = dateYear
                ? dateYear.getFullYear()
                : new Date().getFullYear();
            const db = getDatabase();
            let resource = await db
                .selectFrom('user')
                .where('created_at', '>=', new Date(`${year}-01-01T00:00:00Z`))
                .where('created_at', '<=', new Date(`${year}-12-31T23:59:59Z`))
                .select((eb) => [
                    sql`DATE_PART('month', created_at) AS month`,
                    eb.fn.count('id').as('count'),
                ])
                .groupBy('month')
                .orderBy('month', 'asc')
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success getting resources count',
                        data: resource,
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
    async getPost(request, h) {
        try {
            const { page = 0, name, status } = request.query;
            const limit = 30;

            const db = getDatabase();
            let resource = db
                .selectFrom('destination')
                .innerJoin('user', 'user.id', 'destination.user_id')
                .select((eb) => [
                    'destination.name',
                    'destination.id',
                    'destination.image',
                    'user.username',
                    'user.email',
                    eb
                        .case()
                        .when('destination.deleted_at', 'is', null)
                        .then(false)
                        .else(true)
                        .end()
                        .as('status'),
                ]);
            if (status === 'deleted') {
                resource = resource.where('deleted_at', 'is not', null);
            }
            if (status === 'posted') {
                resource = resource.where('deleted_at', 'is', null);
            }
            if (name) {
                resource = resource.where('name', 'ilike', `${name}%`);
            }

            resource = await resource
                .limit(limit)
                .offset(page * limit)
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success getting resources count',
                        data: resource,
                    })
                )
                .type('application/json');
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
