import { newEnforcer } from 'casbin';
import { getPool } from '../Database.js';
import { BasicAdapter } from 'casbin-basic-adapter';
import path from 'path';

const casbinTableName = 'rbac';
const __dirname = import.meta.dirname;
const adapter = await BasicAdapter.newAdapter('pg', getPool(), casbinTableName);

const enforcer = await newEnforcer(
    path.join(__dirname, 'rbac_model.conf'),
    adapter
);

/**
 *
 * @returns {typeof enforcer}
 */
export function getEnforcer() {
    return enforcer;
}

/**
 * @param {number | string} user
 * @returns {string}
 */
export function createStringUser(user) {
    return `user::${user}`;
}

/**
 * @param {number | string} role
 * @returns {string}
 */
export function createStringRole(role) {
    return `role::${role}`;
}

/**
 * @param {string} resourceName
 * @param {number} resourceId
 * @returns {string}
 */
export function createStringResource(resourceName, resourceId) {
    return `resource:${resourceName}::${resourceId}`;
}

/**
 * @param {string} user
 * @param {string} resource
 * @param {string} action
 * @returns {boolean}
 */
export async function userCanDo(user, resource, action) {
    return await enforcer.enforce(user, resource, action);
}
