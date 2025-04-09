import Joi from 'joi';
import { AdminController } from '../controllers/AdminController.js';
import { invalidField } from '../util/errorHandler.js';
import { isAdmin } from '../middleware/auth.js';

const controller = new AdminController();
/**
 * @type {import("@hapi/hapi").ServerRoute[]}
 */
export default [
    {
        method: ['get'],
        path: '/api/admin/analytics',
        options: {
            tags: ['api', 'admin', 'analytic'],
            auth: {
                strategy: 'accessToken',
            },

            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                }),
            },
            // pre: [{ method: isAdmin }],
        },

        handler: controller.getResourcesCount.bind(controller),
    },
    {
        method: ['get'],
        path: '/api/admin/destination-analytic',
        options: {
            tags: ['api', 'admin', 'analytic'],
            auth: {
                strategy: 'accessToken',
            },
            validate: {
                query: Joi.object({
                    year: Joi.date(),
                }).options({
                    abortEarly: false,
                    stripUnknown: true,
                    errors: { wrap: { label: false } },
                }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.array().items(
                        Joi.object({
                            count: Joi.number(),
                            month: Joi.number(),
                        })
                    ),
                }),
            },
            // pre: [{ method: isAdmin }],
        },
        handler: controller.getDestinationAnalytic.bind(controller),
    },
    {
        method: ['get'],
        path: '/api/admin/user-analytic',
        options: {
            tags: ['api', 'admin', 'analytic'],
            auth: {
                strategy: 'accessToken',
            },
            validate: {
                query: Joi.object({
                    year: Joi.date(),
                }).options({
                    abortEarly: false,
                    stripUnknown: true,
                    errors: { wrap: { label: false } },
                }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.array().items(
                        Joi.object({
                            count: Joi.number(),
                            month: Joi.number(),
                        })
                    ),
                }),
            },
            // pre: [{ method: isAdmin }],
        },
        handler: controller.getUserAnalytic.bind(controller),
    },
    {
        method: ['get'],
        path: '/api/admin/destinations',
        options: {
            tags: ['api', 'admin', 'destinations'],
            auth: {
                strategy: 'accessToken',
            },
            validate: {
                query: Joi.object({
                    page: Joi.number().default(0),
                    name: Joi.string(),
                    status: Joi.string().valid('posted', 'deleted'),
                }).options({
                    abortEarly: false,
                    stripUnknown: true,
                    errors: { wrap: { label: false } },
                }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.array().items(
                        Joi.object({
                            name: Joi.string(),
                            id: Joi.number(),
                            image: Joi.string(),
                            username: Joi.string(),
                            email: Joi.string(),
                            status: Joi.string(),
                        })
                    ),
                }),
            },
            // pre: [{ method: isAdmin }],
        },
        handler: controller.getDestinations.bind(controller),
    },
    {
        method: ['PATCH'],
        path: '/api/admin/destination/{postId}/restore',
        options: {
            tags: ['api', 'admin', 'destination'],
            auth: {
                strategy: 'accessToken',
            },

            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.object({
                        name: Joi.string(),
                        id: Joi.number(),
                        image: Joi.string(),
                        username: Joi.string(),
                        email: Joi.string(),
                        status: Joi.string(),
                    }),
                }),
            },
            // pre: [{ method: isAdmin }],
        },
        handler: controller.restoreDestination.bind(controller),
    },
    {
        method: ['GET'],
        path: '/api/admin/users',
        options: {
            tags: ['api', 'admin', 'user'],
            auth: {
                strategy: 'accessToken',
            },
            validate: {
                query: Joi.object({
                    page: Joi.number().default(0),
                    name: Joi.string(),
                    email: Joi.string(),
                    role: Joi.string().valid('admin', 'banned', 'user'),
                }).options({
                    abortEarly: false,
                    stripUnknown: true,
                    errors: { wrap: { label: false } },
                }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                }),
            },
            // pre: [{ method: isAdmin }],
        },
        handler: controller.getUsers.bind(controller),
    },
    {
        method: ['PATCH'],
        path: '/api/admin/user/{userId}/ban',
        options: {
            tags: ['api', 'admin', 'user'],
            auth: {
                strategy: 'accessToken',
            },

            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                }),
            },
            // pre: [{ method: isAdmin }],
        },
        handler: controller.banUser.bind(controller),
    },
    {
        method: ['PATCH'],
        path: '/api/admin/user/{userId}/unban',
        options: {
            tags: ['api', 'admin', 'user'],
            auth: {
                strategy: 'accessToken',
            },

            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                }),
            },
            // pre: [{ method: isAdmin }],
        },
        handler: controller.unbanUser.bind(controller),
    },
    {
        method: ['GET'],
        path: '/api/admin/contacts',
        options: {
            tags: ['api', 'admin', 'user'],
            auth: {
                strategy: 'accessToken',
            },

            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                }),
            },
            // pre: [{ method: isAdmin }],
        },
        handler: controller.getContacts.bind(controller),
    },
];
