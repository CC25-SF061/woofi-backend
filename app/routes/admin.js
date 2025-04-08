import Joi from 'joi';
import { AdminController } from '../controllers/AdminController.js';
import { invalidField } from '../util/errorHandler.js';

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
        },
        handler: controller.getDestinationAnalytic.bind(controller),
    },
    {
        method: ['get'],
        path: '/api/admin/destinations',
        options: {
            tags: ['api', 'admin', 'destination'],
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
            // response: {
            //     failAction: 'log',
            //     schema: Joi.object({
            //         message: Joi.string(),
            //         success: Joi.boolean(),
            //         data: Joi.array().items(
            //             Joi.object({
            //                 count: Joi.number(),
            //                 month: Joi.number(),
            //             })
            //         ),
            //     }),
            // },
        },
        handler: controller.getPost.bind(controller),
    },
];
