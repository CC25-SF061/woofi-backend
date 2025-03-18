import Boom from '@hapi/boom';
import { getDatabase } from '../../core/Database.js';
import { reason } from '../../core/ContactConstant.js';

import {
    createStringRole,
    createStringUser,
    getEnforcer,
} from '../../core/rbac/Casbin.js';
import { unauthorized } from '../util/errorHandler.js';
import ErrorConstant from '../../core/ErrorConstant.js';
export class ContactController {
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
    async contact(request, h) {
        try {
            const db = this.db;
            const { payload } = request;

            await db
                .insertInto('contact')
                .values({
                    name: payload.name,
                    email: payload.email,
                    message: payload.message,
                    reason: payload.reason,
                })
                .execute();

            return h.response({
                success: true,
                message: 'success sending contact',
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
    async requestRoleWritter(request, h) {
        try {
            const { payload } = request;
            const { credentials } = request.auth;
            const db = this.db;

            await db
                .insertInto('contact')
                .columns(['user_id', 'email', 'name', 'reason', 'message'])
                .expression((eb) =>
                    eb
                        .selectFrom('user')
                        .where('user.id', '=', credentials.id)
                        .select((eb) => [
                            'user.id',
                            'user.email',
                            'user.name',
                            eb
                                .val(reason.CONTACT_REASON_REQUEST_ROLE_WRITTER)
                                .as('reason'),
                            eb.val(payload.message).as('message'),
                        ])
                )
                .execute();
            return h.response({
                success: true,
                message: 'Success Requesting Role Writter',
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
    async getContacts(request, h) {
        try {
            const { query } = request;
            const db = this.db;
            let contacts = db
                .selectFrom('contact')
                .selectAll()
                .limit(15)
                .offset(query.page * 15);

            if (query.email || query.name) {
                contacts = contacts.where((eb) => {
                    const orExpr = [];
                    if (query.email) {
                        orExpr.push(eb('email', 'like', `${query.email}%`));
                    }
                    if (query.name) {
                        orExpr.push(eb('name', 'like', `${query.name}%`));
                    }

                    return eb.or(orExpr);
                });
            }

            if (query.reason) {
                contacts = contacts.where('reason', '=', query.reason);
            }
            contacts = await contacts.execute();
            console.log(contacts);
            return h
                .response(
                    JSON.stringify(contacts, (_, value) => {
                        if (typeof value == 'bigint') {
                            return value.toString();
                        }
                        return value;
                    })
                )
                .type('application/json');
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
