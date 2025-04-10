import ErrorConstant from '../../core/ErrorConstant.js';
import Boom from '@hapi/boom';
import {
    getEnforcer,
    createStringUser,
    createStringRole,
    createStringResource,
} from '../../core/rbac/Casbin.js';
import { permission, resource } from '../../core/RoleConstant.js';
import { forbidden } from '../util/errorHandler.js';
import { getProvince } from '../../core/GeoLocation.js';

/**
 * @param {import("@hapi/hapi").Request} request
 * @param {import("@hapi/hapi").ResponseToolkit} h
 * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
 */
export async function isAdmin(request, h) {
    const { credentials } = request.auth;
    const enforcer = getEnforcer();
    const hasRole = await enforcer.enforce(
        createStringUser(credentials.id),
        '*',
        permission.ADMIN
    );

    if (!hasRole) {
        return forbidden(h, 'User is not admin', {
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
export async function canDeleteDestination(request, h) {
    const { credentials } = request.auth;
    const { params } = request;
    const enforcer = getEnforcer();

    const canDelete = await enforcer.enforce(
        createStringUser(credentials.id),
        createStringResource(resource.DESTINATION, params.postId),
        permission.DELETE
    );

    if (!canDelete) {
        return forbidden(h, 'Can not delete destination', {
            errCode: ErrorConstant.ERR_USER_IS_NOT_OWNER,
        }).takeover();
    }

    return request.pre;
}

/**
 * @param {import("@hapi/hapi").Request} request
 * @param {import("@hapi/hapi").ResponseToolkit} h
 * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
 */
export async function canEditDestination(request, h) {
    const { credentials } = request.auth;
    const { params } = request;
    const enforcer = getEnforcer();
    const canEdit = await enforcer.enforce(
        createStringUser(credentials.id),
        createStringResource(resource.DESTINATION, params.postId),
        permission.EDIT
    );
    if (!canEdit) {
        return forbidden(h, 'Can not delete destination', {
            errCode: ErrorConstant.ERR_USER_IS_NOT_OWNER,
        }).takeover();
    }

    return request.pre;
}

/**
 * @param {number | string} id
 * @returns
 */
export async function isBanned(id) {
    const enforcer = getEnforcer();

    return await enforcer.hasRoleForUser(
        createStringUser(id),
        createStringRole('banned')
    );
}

/**
 * @param {import("@hapi/hapi").Request} request
 * @param {import("@hapi/hapi").ResponseToolkit} h
 * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
 */
export async function isBannedRequest(request, h) {
    const { credentials } = request.auth;
    const banned = await isBanned(credentials.id);
    if (banned) {
        return Boom.unauthorized('Account is suspended');
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
        return forbidden(h, 'User is not writter', {
            errCode: ErrorConstant.ERR_NOT_WRITTER,
        }).takeover();
    }

    return request.pre;
}
