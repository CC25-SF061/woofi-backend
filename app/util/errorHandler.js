import Boom from '@hapi/boom';
import errorConstant from '../../core/ErrorConstant.js';
/**
 *
 * @param {*} _
 * @param {import("@hapi/hapi").ResponseToolkit} h
 * @param {Error} err
 * @returns {import('@hapi/hapi').ResponseValue}
 */
export function invalidField(_, h, err) {
    const badRequestErr = Boom.badRequest('Invalid Field');
    const invalidFieldErr = Object.assign(badRequestErr.output, {
        payload: {
            ...badRequestErr.output.payload,
            errCode: errorConstant.ERR_INVALID_FIELD,
            fields: err.details,
        },
        success: false,
        message: 'Invalid Payload',
    });
    return h
        .response(invalidFieldErr)
        .code(badRequestErr.output.statusCode)
        .takeover();
}

/**
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @param {string} message
 * @param {object} body
 * @param {object} payload
 * @returns {import('@hapi/hapi').ResponseValue}
 */
export function badRequest(h, message, payload, header, body) {
    const badRequest = Boom.badRequest(message).output;

    Object.assign(badRequest, {
        success: false,
        message: 'Bad Request',
        payload: {
            ...badRequest.payload,
            ...payload,
        },
        header: {
            ...badRequest.headers,
            ...header,
        },
        ...body,
    });
    return h.response(badRequest).code(badRequest.statusCode);
}

/**
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @param {string} message
 * @param {object} body
 * @param {object} payload
 * @returns {import('@hapi/hapi').ResponseObject}
 */
export function forbidden(h, message, payload, header, body) {
    const badRequest = Boom.forbidden(message).output;

    Object.assign(badRequest, {
        success: false,
        message: 'Bad Request',
        payload: {
            ...badRequest.payload,
            ...payload,
        },
        header: {
            ...badRequest.headers,
            ...header,
        },
        ...body,
    });

    return h.response(badRequest).code(badRequest.statusCode);
}

export function notFound(h) {
    return h
        .response(
            Object.assign(Boom.notFound().output, {
                success: false,
                message: 'Not Found',
                payload: {
                    errCode: errorConstant.ERR_NOT_FOUND,
                },
            })
        )
        .code(404);
}
/**
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @returns {import('@hapi/hapi').ResponseObject}
 */
export function unauthorized(message) {
    return Boom.unauthorized(message);
}
