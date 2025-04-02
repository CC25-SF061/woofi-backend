import { DestinationController } from '../controllers/DestinationController.js';
import Joi from 'joi';
import { invalidField } from '../util/errorHandler.js';
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
                    province: Joi.string(),
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

        handler: controller.addPost.bind(controller),
    },
    {
        method: ['GET'],
        path: '/api/destination/{postId}',
        options: {
            tags: ['api', 'destination'],
            auth: {
                mode: 'try',
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
                        isWishlisted: Joi.boolean(),
                        rating: Joi.number(),
                        writer: Joi.string(),
                        id: Joi.number(),
                        created_at: Joi.date(),
                        detail: Joi.string(),
                        image: Joi.string(),
                        location: Joi.string(),
                        user_id: Joi.string(),
                        province: Joi.string(),
                        name: Joi.string(),
                        ratingCount: Joi.string(),
                    }),
                }),
            },
        },

        handler: controller.getDetailPost.bind(controller),
    },
    {
        method: ['GET'],
        path: '/api/destinations',
        options: {
            tags: ['api', 'destination'],
            auth: {
                mode: 'try',
                strategy: 'accessToken',
            },
            validate: {
                query: Joi.object({
                    page: Joi.number().default(0),
                    province: Joi.string(),
                    name: Joi.string(),
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
                            id: Joi.number(),
                            detail: Joi.string(),
                            image: Joi.string(),
                            rating: Joi.number(),
                            isWishlisted: Joi.boolean(),
                            province: Joi.string(),
                        })
                    ),
                }),
            },
        },

        handler: controller.getPosts.bind(controller),
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
