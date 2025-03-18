import { Kysely } from 'kysely';
import bcrypt from 'bcrypt';
import {
    getEnforcer,
    createStringRole,
    createStringUser,
} from '../../core/rbac/Casbin.js';
/**
 * @param {Kysely<import("kysely-codegen").DB} db
 * @returns {Promise<void>}
 */
export async function seed(db) {
    const user = await db
        .insertInto('user')
        .values({
            name: 'admin',
            is_verified: true,
            username: 'admin',
            email: process.env.ADMIN_EMAIL,
            password: bcrypt.hashSync(
                process.env.ADMIN_PASSWORD,
                parseInt(process.env.BCRYPT_HASH_ROUND)
            ),
        })
        .returning('id')
        .executeTakeFirst();

    const enforcer = getEnforcer();

    await enforcer.addPermissionForUser(createStringRole('admin'), '*', '*');
    await enforcer.addRoleForUser(
        createStringUser(user.id),
        createStringRole('admin')
    );
}
