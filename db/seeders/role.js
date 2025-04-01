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
    const enforcer = getEnforcer();
    await enforcer.addPermissionForUser(createStringRole('admin'), '*', '*');
    await enforcer.addGroupingPolicies([
        [createStringRole('admin'), createStringRole('writter')],
    ]);
    await enforcer.addPermissionForUser(
        createStringRole('writter'),
        '*',
        'create'
    );
}
