import { Kysely } from 'kysely';
import { getEnforcer, createStringRole } from '../../core/rbac/Casbin.js';
import { permission } from '../../core/RoleConstant.js';
/**
 * @param {Kysely<import("kysely-codegen").DB} db
 * @returns {Promise<void>}
 */
export async function seed(db) {
    const enforcer = getEnforcer();
    await enforcer.addPermissionForUser(
        createStringRole('banned'),
        '*',
        '*',
        'deny'
    );
    await enforcer.addPermissionForUser(createStringRole('admin'), '*', '*');
    await enforcer.addPermissionForUser(
        createStringRole('admin'),
        '*',
        permission.ADMIN
    );
    await enforcer.addRoleForUser(
        createStringRole('super_admin'),
        createStringRole('admin')
    );
}
