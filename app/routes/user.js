import Joi from 'joi';
import { invalidField } from '../util/errorHandler.js';
import { UserController } from '../controllers/UserController.js';

const controller = new UserController();
/**
 * @type {import("@hapi/hapi").ServerRoute[]}
 */
export default [
    {
        method: ['GET'],
        path: '/api/user/{userId}',
        options: {
            tags: ['api', 'wishlist'],
            auth: {
                strategy: 'accessToken',
                mode: 'optional',
            },
            validate: {
                params: Joi.object({
                    userId: Joi.number(),
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
        },
        handler: controller.getUserData.bind(controller),
    },
];
