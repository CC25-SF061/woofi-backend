import ErrorConstant from '../../core/ErrorConstant.js';
import {
    getEnforcer,
    createStringUser,
    createStringRole,
} from '../../core/rbac/Casbin.js';
import { unauthorized } from '../util/errorHandler.js';

/**
 * @param {import("@hapi/hapi").Request} request
 * @param {import("@hapi/hapi").ResponseToolkit} h
 * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
 */
export async function isAdmin(request, h) {
    const { credentials } = request.auth;
    const enforcer = getEnforcer();
    const hasRole = await enforcer.hasRoleForUser(
        createStringUser(credentials.id),
        createStringRole('admin')
    );

    if (!hasRole) {
        return unauthorized(h, 'User is not admin', {
            errCode: ErrorConstant.ERR_NOT_ADMIN,
        }).takeover();
    }

    return request.pre;
}

/**
 * @param {import("@hapi/hapi").Request} request
 * @param {import("@hapi/hapi").ResponseToolkit} h
 * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
 */
export async function isWritter(request, h) {
    const { credentials } = request.auth;
    const enforcer = getEnforcer();
    const hasRole = await enforcer.enforce(
        createStringUser(credentials.id),
        '*',
        'create'
    );

    if (!hasRole) {
        return unauthorized(h, 'User is not writter', {
            errCode: ErrorConstant.ERR_NOT_WRITTER,
        }).takeover();
    }

    return request.pre;
}
