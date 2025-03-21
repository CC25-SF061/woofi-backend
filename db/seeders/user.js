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
    if (process.env.APP_ENV === 'production') {
        return;
    }
    const user = await db
        .insertInto('user')
        .values({
            name: 'john',
            is_verified: true,
            username: 'john1234',
            email: 'john@example.com',
            password: bcrypt.hashSync(
                'john1234',
                parseInt(process.env.BCRYPT_HASH_ROUND)
            ),
        })
        .returning('id')
        .executeTakeFirst();

    const enforcer = getEnforcer();

    await enforcer.addRoleForUser(
        createStringUser(user.id),
        createStringRole('writter')
    );
}
