import { DestinationController } from '../controllers/DestinationController.js';
import Joi from 'joi';
import { invalidField } from '../util/errorHandler.js';
import { fileTypeFromBuffer } from 'file-type';
import { isWritter } from '../middleware/auth.js';
const controller = new DestinationController();

/**
 * @type {import("@hapi/hapi").ServerRoute[]}
 */
export default [
    {
        method: ['POST'],
        path: '/api/destination/add',
        options: {
            auth: 'accessToken',
            payload: {
                parse: true,
                allow: 'multipart/form-data',
                multipart: true,
                maxBytes: 1048576 * 4,
                output: 'stream',
            },
            tags: ['api', 'destination'],
            validate: {
                payload: Joi.object({
                    image: Joi.required()
                        .custom((value, h) => {
                            const fileType = value.hapi.headers['content-type'];
                            if (
                                !['image/jpeg', 'image/png'].includes(fileType)
                            ) {
                                return h.error('any.invalid');
                            }
                            return value;
                        }, 'mime-type')
                        .messages({
                            'any.invalid': 'Invalid image must be png or jpeg',
                        })
                        .error((errors) => {
                            errors[0].value = 'REDACTED';
                            errors[0].local.value = 'REDACTED';
                            return errors;
                        }),
                    name: Joi.string().required().max(50),
                    location: Joi.string().required().max(50),
                    detail: Joi.string().required(),
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
            pre: [{ method: isWritter }],
        },

        handler: controller.addPost.bind(controller),
    },
    {
        method: ['GET'],
        path: '/api/destination/{postId}',
        options: {
            tags: ['api', 'destination'],
            auth: {
                mode: 'optional',
                strategy: 'accessToken',
            },
            validate: {
                params: Joi.object({
                    postId: Joi.number().required(),
                }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.object({
                        personalRating: Joi.number(),
                        wishlistId: Joi.number(),
                        rating: Joi.number(),
                        id: Joi.number(),
                        created_at: Joi.date(),
                        detail: Joi.string(),
                        image: Joi.string(),
                        location: Joi.string(),
                        user_id: Joi.string(),
                    }),
                }),
            },
        },

        handler: controller.getPost.bind(controller),
    },
    {
        method: ['POST'],
        path: '/api/destination/rating/{postId}',
        options: {
            auth: 'accessToken',
            tags: ['api', 'destination'],
            validate: {
                payload: Joi.object({
                    score: Joi.number(),
                }),
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

        handler: controller.addRating.bind(controller),
    },
];
