import { sql } from 'kysely';
import { getDatabase } from '../../core/Database.js';
import Boom from '@hapi/boom';
import { JSONToString } from '../util/json.js';
import {
    createStringRole,
    createStringUser,
    getEnforcer,
} from '../../core/rbac/Casbin.js';
import { notFound, badRequest } from '../util/errorHandler.js';
import ErrorConstant from '../../core/ErrorConstant.js';
import { transport } from '../../core/Mailer.js';

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
            const year = dateYear || new Date().getFullYear();
            const db = getDatabase();
            let resource = db
                .selectFrom('destination')
                .where('created_at', '>=', new Date(`${year}-01-01T00:00:00Z`))
                .where('created_at', '<=', new Date(`${year}-12-31T23:59:59Z`))
                .select((eb) => [
                    sql`DATE_PART('month', created_at) AS month`,
                    eb.fn.count('id').as('count'),
                ])
                .groupBy('month')
                .orderBy('month', 'asc');
            resource = await resource.execute();
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
            const year = dateYear || new Date().getFullYear();
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
            const limit = 15;

            const db = getDatabase();
            let resource = db
                .selectFrom('destination')
                .innerJoin('user', 'user.id', 'destination.user_id')
                .select((eb) => [
                    'destination.name',
                    'destination.id',
                    'destination.image',
                    'destination.detail',
                    'destination.location',
                    'destination.province',
                    'destination.category',
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
                // .limit(limit)
                // .offset(page * limit)
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
                        .selectFrom((eb) =>
                            eb
                                .selectFrom('user as u')
                                .leftJoin('rbac as r', (join) =>
                                    join.onRef(
                                        sql`'user::' || u.id`,
                                        '=',
                                        'r.v0'
                                    )
                                )
                                .select((eb) => [
                                    eb
                                        .case()
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('admin')
                                        )
                                        .then('admin')
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('super_admin')
                                        )
                                        .then(`super_admin`)
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('banned')
                                        )
                                        .then('banned')
                                        .else('user')
                                        .end()
                                        .as('role'),
                                    eb
                                        .case()
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('admin')
                                        )
                                        .then(2)
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('super_admin')
                                        )
                                        .then(1)
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('banned')
                                        )
                                        .then(3)
                                        .else(4)
                                        .end()
                                        .as('role_priority'),
                                    eb
                                        .case()
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('admin')
                                        )
                                        .then(2)
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('super_admin')
                                        )
                                        .then(1)
                                        .when(
                                            'r.v1',
                                            '=',
                                            createStringRole('banned')
                                        )
                                        .then(4)
                                        .else(3)
                                        .end()
                                        .as('role_priority2'),
                                    'u.id',
                                    'u.username',
                                    'u.email',
                                    'u.profile_image',
                                ])
                                // .orderBy('role_priority')
                                .as('result')
                        )
                        .selectAll()
                        .select([
                            sql`ROW_NUMBER() OVER (PARTITION BY result.id ORDER BY result.role_priority)`.as(
                                'row_number'
                            ),
                        ])

                        .as('result')
                )
                .select([
                    'result.id',
                    'result.profile_image',
                    'result.role',
                    'result.username',
                    'result.email',
                ])
                .where('result.row_number', '=', 1)
                .orderBy('result.role_priority2')

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
                // .limit(limit)
                // .offset(page * limit)
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'Success getting users',
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
        await Promise.all([
            db
                .insertInto('notification_user')
                .values({
                    expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    detail: 'You have been promotoed to admin',
                    from: 'Admin',
                    user_id: userId,
                })
                .execute(),
            enforcer.addRoleForUser(
                createStringUser(userId),
                createStringRole('admin')
            ),
        ]);

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
        await Promise.all([
            db
                .insertInto('notification_user')
                .values({
                    expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    detail: 'You have been demoted to user',
                    from: 'Admin',
                    user_id: userId,
                })
                .execute(),
            enforcer.deleteRoleForUser(
                createStringUser(userId),
                createStringRole('admin')
            ),
        ]);

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
        const { payload } = request;
        const db = getDatabase();
        const user = await db
            .selectFrom('user')
            .where('id', '=', userId)
            .select(['id', 'email'])
            .executeTakeFirst();
        if (!user) {
            return notFound(h);
        }
        const transporter = transport();
        const enforcer = getEnforcer();
        if (
            await enforcer.hasRoleForUser(
                createStringUser(userId),
                createStringRole('super_admin')
            )
        ) {
            return badRequest(h, 'Can not ban super admin', {
                errCode: ErrorConstant.ERR_USER_IS_SUPER_ADMIN,
            });
        }

        await Promise.all([
            enforcer.addRoleForUser(
                createStringUser(userId),
                createStringRole('banned')
            ),
            db.deleteFrom('token').where('user_id', '=', userId).execute(),
        ]);

        transporter.sendMail({
            to: user.email,
            subject: 'You have been banned',
            from: '"Woofi" <no-reply@woofi.com',
            html: `Your account has been suspended. Reason : ${payload.reason}`,
        });
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
        const transporter = transport();
        const user = await db
            .selectFrom('user')
            .where('id', '=', userId)
            .select(['id', 'email'])
            .executeTakeFirst();
        if (!user) {
            return notFound(h);
        }

        const enforcer = getEnforcer();

        await enforcer.deleteRoleForUser(
            createStringUser(userId),
            createStringRole('banned')
        );

        transporter.sendMail({
            to: user.email,
            subject: 'You have been unbanned',
            from: '"Woofi" <no-reply@woofi.com',
            html: `Your account has been Unbaned.`,
        });
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
                .selectFrom((eb) =>
                    eb
                        .selectFrom('contact as c')
                        .leftJoin('user as u', 'u.id', 'c.user_id')

                        .leftJoin(
                            'contact_reply as cr',
                            'cr.contact_id',
                            'c.id'
                        )
                        .select((eb) => [
                            'c.id',
                            'c.reply_id',
                            'c.email',
                            'c.name',
                            'c.message',
                            'c.reason',
                            'u.profile_image',
                            eb
                                .case()
                                .when('cr.id', 'is', null)
                                .then(false)
                                .else(true)
                                .end()
                                .as('replied'),
                        ])
                        .distinct()
                        .as('result')
                )
                .selectAll();
            // .select([
            //     'result.id',
            //     'result.email',
            //     'result.name',
            //     'result.profile_image',
            //     'result.replied',
            //     'result.reason',
            //     'result.message',
            //     'result.reply_id',
            // ]);

            if (q) {
                contact = contact.where(({ or, eb }) =>
                    or([
                        eb('result.name', 'ilike', `${q}%`),
                        eb('result.email', 'ilike', `${q}%`),
                    ])
                );
            }

            if (status === 'replied') {
                contact = contact.where('result.replied', '=', true);
            }
            if (status === 'unreplied') {
                contact = contact.where('result.replied', '=', false);
            }

            contact = await contact
                // .orderBy('cr.id', sql`asc nulls first`)
                .execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'success getting contact',
                        data: contact,
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
    async reply(request, h) {
        try {
            const db = getDatabase();
            const { payload } = request;
            const { params } = request;

            const contact = await db
                .selectFrom('contact')
                .where('id', '=', params.contactId)
                .selectAll()
                .executeTakeFirst();
            if (!contact) {
                return notFound(h);
            }
            const reply = await db
                .insertInto('contact_reply')
                .values({
                    contact_id: params.contactId,
                    message: payload.message,
                })
                .returning(['id'])
                .executeTakeFirst();

            const transporter = transport();

            const replyURL = new URL(process.env.FRONT_END_CONTACT_URL);

            replyURL.searchParams.append('reply_id', reply.id);
            replyURL.searchParams.append('type', 'reply');
            replyURL.searchParams.append('reason', 'REPLY CONTACT');
            transporter.sendMail({
                from: '"Woofi" <no-reply@woofi.com',
                to: contact.email,
                subject: `RE: ${contact.reason}`,
                html: `
                ${payload.message.replace('\n', '<br />')} 
                <br /> ======================== <br />
                <p>
                    Follow this <a href="${
                        replyURL.href
                    }"> to reply this message </a>
                </p>
                `,
            });

            return h.response({
                success: true,
                message: 'success send contact',
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
    async getDetailReply(request, h) {
        try {
            const db = getDatabase();
            const { params } = request;

            const reply = await db
                .selectFrom('contact_reply as cr')
                .where('cr.id', '=', params.replyId)
                .select(['cr.message', 'cr.id', 'cr.contact_id'])
                .executeTakeFirst();
            if (!reply) {
                return notFound(h);
            }

            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'success send contact',
                        data: reply,
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
    async getDetailContact(request, h) {
        try {
            const db = getDatabase();
            const { params } = request;
            console.log(params);
            let contact = await db
                .selectFrom((eb) =>
                    eb
                        .selectFrom('contact as c')
                        .leftJoin('user as u', 'u.id', 'c.user_id')

                        .leftJoin(
                            'contact_reply as cr',
                            'cr.contact_id',
                            'c.id'
                        )
                        .select((eb) => [
                            'c.id',
                            'c.reply_id',
                            'c.email',
                            'c.name',
                            'c.message',
                            'c.reason',
                            'u.profile_image',
                            eb
                                .case()
                                .when('cr.id', 'is', null)
                                .then(false)
                                .else(true)
                                .end()
                                .as('replied'),
                        ])
                        .distinct()
                        .as('result')
                )
                .where('result.id', '=', params.contactId)
                .selectAll()
                .executeTakeFirst();
            if (!contact) {
                return notFound(h);
            }

            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'success send contact',
                        data: contact,
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
    async createDeleteNotification(request, h) {
        try {
            const db = getDatabase();
            const { payload, params } = request;
            const destination = await db
                .selectFrom('destination')
                .where('destination.id', '=', params.postId)
                .where('deleted_at', 'is', null)
                .leftJoin('user', 'user.id', 'destination.user_id')
                .select(['user_id'])

                .executeTakeFirst();
            console.log(destination);
            if (!destination) {
                return notFound(h);
            }
            await db
                .insertInto('notification_user')
                .values({
                    detail: payload.reason,
                    from: 'Admin',
                    user_id: destination.user_id,
                })
                .execute();

            return h.response({
                success: true,
                message: 'success creating notification',
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
    async getNotifications(request, h) {
        try {
            const db = getDatabase();
            const { credentials } = request.auth;

            let notification = db
                .selectFrom('notification_admin as na')
                .leftJoin(
                    (eb) =>
                        eb
                            .selectFrom('user')
                            .where('user.id', '=', credentials.id)
                            .leftJoin(
                                'notification_admin_read as nda',
                                'nda.admin_id',
                                'user.id'
                            )

                            .select('nda.notification_id')
                            .as('read'),
                    (join) => join.onRef('read.notification_id', '=', 'na.id')
                )
                .select((eb) => [
                    'na.id',
                    'na.detail',
                    'na.created_at',
                    'na.from',
                    eb
                        .case()
                        .when('read.notification_id', 'is', null)
                        .then(false)
                        .else(true)
                        .end()
                        .as('is_read'),
                ])
                .where('na.expired_at', '>', new Date())
                .orderBy('na.created_at', 'desc')
                .orderBy(sql`read.notification_id nulls first`);

            notification = await notification.execute();
            return h
                .response(
                    JSONToString({
                        success: true,
                        message: 'success getting notification',
                        data: notification,
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
    async markNotificationAsRead(request, h) {
        try {
            const db = getDatabase();
            const { payload } = request;
            const { credentials } = request.auth;

            if (payload.notificationIds.length === 0) {
                return h.response({
                    success: true,
                    message: 'success mark notifications as read',
                });
            }
            await db
                .insertInto('notification_admin_read')
                .values(
                    payload.notificationIds.map((value) => ({
                        admin_id: credentials.id,
                        notification_id: value,
                    }))
                )
                .onConflict((con) => con.doNothing())
                .execute();

            return h.response({
                success: true,
                message: 'success mark notifications as read',
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
