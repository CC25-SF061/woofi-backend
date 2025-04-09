import { sql } from 'kysely';
import { getDatabase } from '../../core/Database.js';
import Boom, { badRequest } from '@hapi/boom';
import { JSONToString } from '../util/json.js';
import {
    createStringRole,
    createStringUser,
    getEnforcer,
} from '../../core/rbac/Casbin.js';
import { notFound } from '../util/errorHandler.js';
import ErrorConstant from '../../core/ErrorConstant.js';

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
                        message: 'Success getting destinations count',
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
                        message: 'Success getting users count',
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
    async getDestinations(request, h) {
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
                        .then('posted')
                        .else('deleted')
                        .end()
                        .as('status'),
                ]);
            if (status === 'deleted') {
                resource = resource.where(
                    'destination.deleted_at',
                    'is not',
                    null
                );
            }
            if (status === 'posted') {
                resource = resource.where('destination.deleted_at', 'is', null);
            }
            if (name) {
                resource = resource.where(
                    'destination.name',
                    'ilike',
                    `${name}%`
                );
            }

            resource = await resource
                .limit(limit)
                .offset(page * limit)
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success getting destinations',
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
    async restoreDestination(request, h) {
        try {
            const { postId } = request.params;
            const db = getDatabase();
            const destination = await db
                .selectFrom('destination')
                .where('id', '=', postId)
                .select('id')
                .executeTakeFirst();
            if (!destination) {
                return notFound(h);
            }
            const resource = await db
                .with('d', (db) =>
                    db
                        .updateTable('destination')
                        .set({ deleted_at: null })
                        .where('id', '=', postId)
                        .returning(['id', 'name', 'image', 'user_id'])
                )
                .selectFrom('d')
                .innerJoin('user', 'user.id', 'd.user_id')
                .select([
                    'd.name',
                    'd.id',
                    'd.image',
                    'user.username',
                    'user.email',
                    sql`'posted'`.as('status'),
                ])
                .executeTakeFirst();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success restoring destination',
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
    async getUsers(request, h) {
        try {
            const { page = 0, q, role } = request.query;
            const limit = 30;
            const db = getDatabase();

            let resource = db
                .selectFrom((eb) =>
                    eb
                        .selectFrom('user as u')
                        .leftJoin('rbac as r', (join) =>
                            join.onRef(sql`'user::' || u.id`, '=', 'r.v0')
                        )
                        .select((eb) => [
                            eb
                                .case()
                                .when('r.v1', '=', createStringRole('admin'))
                                .then('admin')
                                .when(
                                    'r.v1',
                                    '=',
                                    createStringRole('super_admin')
                                )
                                .then(`super_admin`)
                                .when('r.v1', '=', createStringRole('banned'))
                                .then('banned')
                                .else('user')
                                .end()
                                .as('role'),
                            'u.id',
                            'u.username',
                            'u.email',
                            'u.profile_image',
                        ])
                        .as('result')
                )
                .selectAll();

            if (q) {
                resource = resource.where(({ or, eb }) =>
                    or([
                        eb('result.username', 'ilike', `${q}%`),
                        eb('result.email', 'ilike', `${q}%`),
                    ])
                );
            }
            if (role) {
                resource = resource.where('result.role', '=', role);
            }
            resource = await resource
                .limit(limit)
                .offset(page * limit)
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success restoring destination',
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
    async promoteToAdmin(request, h) {
        const { userId } = request.params;
        const db = getDatabase();
        const user = await db
            .selectFrom('user')
            .where('id', '=', userId)
            .select('id')
            .executeTakeFirst();
        if (!user) {
            return notFound(h);
        }

        const enforcer = getEnforcer();
        if (
            await enforcer.hasRoleForUser(
                createStringUser(userId),
                createStringRole('super_admin')
            )
        ) {
            return badRequest(h, 'Can not demote super admin', {
                errCode: ErrorConstant.ERR_USER_IS_SUPER_ADMIN,
            }).takeover();
        }
        await enforcer.addRoleForUser(
            createStringUser(userId),
            createStringRole('admin')
        );

        return h.response({
            success: true,
            message: 'Success promoting user to admin',
        });
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async demoteToUser(request, h) {
        const { userId } = request.params;
        const db = getDatabase();
        const user = await db
            .selectFrom('user')
            .where('id', '=', userId)
            .select('id')
            .executeTakeFirst();
        if (!user) {
            return notFound(h);
        }

        const enforcer = getEnforcer();
        if (
            await enforcer.hasRoleForUser(
                createStringUser(userId),
                createStringRole('super_admin')
            )
        ) {
            return badRequest(h, 'Can not demote super admin', {
                errCode: ErrorConstant.ERR_USER_IS_SUPER_ADMIN,
            }).takeover();
        }
        await enforcer.deleteRoleForUser(
            createStringUser(userId),
            createStringRole('admin')
        );

        return h.response({
            success: true,
            message: 'Success demoting user',
        });
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async banUser(request, h) {
        const { userId } = request.params;
        const db = getDatabase();
        const user = await db
            .selectFrom('user')
            .where('id', '=', userId)
            .select('id')
            .executeTakeFirst();
        if (!user) {
            return notFound(h);
        }

        const enforcer = getEnforcer();
        if (
            await enforcer.hasRoleForUser(
                createStringUser(userId),
                createStringRole('super_admin')
            )
        ) {
            return badRequest(h, 'Can not ban super admin', {
                errCode: ErrorConstant.ERR_USER_IS_SUPER_ADMIN,
            }).takeover();
        }

        await enforcer.addRoleForUser(
            createStringUser(userId),
            createStringRole('banned')
        );

        return h.response({
            success: true,
            message: 'Success ban user',
        });
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async unbanUser(request, h) {
        const { userId } = request.params;
        const db = getDatabase();
        const user = await db
            .selectFrom('user')
            .where('id', '=', userId)
            .select('id')
            .executeTakeFirst();
        if (!user) {
            return notFound(h);
        }

        const enforcer = getEnforcer();

        await enforcer.deleteRoleForUser(
            createStringUser(userId),
            createStringRole('banned')
        );

        return h.response({
            success: true,
            message: 'Success unban user',
        });
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getContacts(request, h) {
        try {
            const db = getDatabase();
            const { q, status } = request.query;

            let contact = db
                .selectFrom('contact as c')
                .leftJoin('user as u', 'u.id', 'c.user_id')
                .select([
                    'c.email',
                    'c.name',
                    'c.message',
                    'c.reason',
                    'c.replied_at',
                    'u.profile_image',
                ]);

            if (q) {
                contact = contact.where(({ or, eb }) =>
                    or([
                        eb('c.name', 'ilike', `${q}%`),
                        eb('c.email', 'ilike', `${q}%`),
                    ])
                );
            }

            if (status === 'replied') {
                contact = contact.where('c.replied_at', 'is not', null);
            }
            if (status === 'unreplied') {
                contact = contact.where('c.replied_at', 'is', null);
            }

            contact = await contact
                .orderBy('c.replied_at', sql`asc nulls first`)
                .execute();
            return h.response({
                success: true,
                message: 'success getting contact',
                data: contact,
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
