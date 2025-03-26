import Joi from 'joi';
import { invalidField } from '../util/errorHandler.js';
import { WhislistController } from '../controllers/WhislistController.js';

const controller = new WhislistController();
/**
 * @type {import("@hapi/hapi").ServerRoute[]}
 */
export default [
    {
        method: ['POST'],
        path: '/api/user/wishlist/{postId}',
        options: {
            tags: ['api', 'wishlist'],
            auth: 'accessToken',
            validate: {
                params: Joi.object({
                    postId: Joi.number(),
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
        handler: controller.whislist.bind(controller),
    },
    {
        method: ['DELETE'],
        path: '/api/user/wishlist/{postId}',
        options: {
            tags: ['api', 'wishlist'],
            auth: 'accessToken',
            validate: {
                params: Joi.object({
                    postId: Joi.number(),
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
        handler: controller.deleteWhislist.bind(controller),
    },
];
