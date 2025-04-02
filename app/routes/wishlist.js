import Joi from 'joi';
import { invalidField } from '../util/errorHandler.js';
import { WishlistController } from '../controllers/WishlistController.js';

const controller = new WishlistController();
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
        handler: controller.wishlist.bind(controller),
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
        handler: controller.deletewishlist.bind(controller),
    },
];
