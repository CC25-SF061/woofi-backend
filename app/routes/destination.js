import { DestinationController } from '../controllers/DestinationController.js';
import Joi from 'joi';
import { invalidField } from '../util/errorHandler.js';
import {
    canDeleteDestination,
    canEditDestination,
} from '../middleware/auth.js';
import { getCategory, getProvince } from '../../core/GeoLocation.js';
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
                timeout: false,
                maxBytes: 1048576 * 10,
                output: 'stream',
            },
            timeout: {
                socket: 1000 * 10,
            },
            tags: ['api', 'destination'],
            validate: {
                payload: Joi.object({
                    image: Joi.required()
                        .custom((value, h) => {
                            const fileType =
                                value?.hapi?.headers?.['content-type'];
                            if (
                                ![
                                    'image/jpeg',
                                    'image/png',
                                    'image/webp',
                                ].includes(fileType)
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
                    detail: Joi.string().required().label('description'),
                    province: Joi.string()
                        .valid(...getProvince().map((e) => e.name))
                        .messages({
                            'any.only': 'Invalid province',
                        }),
                    category: Joi.string()
                        .required()
                        .valid(...getCategory())
                        .messages({
                            'any.only': 'Invalid Category',
                        }),
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
                    data: Joi.object({
                        postId: Joi.number(),
                    }),
                }),
            },
        },

        handler: controller.addPost.bind(controller),
    },
    {
        method: ['PUT'],
        path: '/api/destination/{postId}',
        options: {
            auth: 'accessToken',
            payload: {
                parse: true,
                allow: 'multipart/form-data',
                multipart: true,
                maxBytes: 1048576 * 10,
                output: 'stream',
            },
            tags: ['api', 'destination'],
            validate: {
                payload: Joi.object({
                    image: Joi.custom((value, h) => {
                        const fileType = value?.hapi?.headers?.['content-type'];
                        if (!['image/jpeg', 'image/png'].includes(fileType)) {
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
                    name: Joi.string().max(50),
                    location: Joi.string().max(50),
                    detail: Joi.string().label('description'),
                    province: Joi.string()
                        .valid(...getProvince().map((e) => e.name))
                        .messages({
                            'any.only': 'Invalid province',
                        }),
                    category: Joi.string()
                        .required()
                        .valid(...getCategory())
                        .messages({
                            'any.only': 'Invalid Category',
                        }),
                }).options({
                    stripUnknown: true,
                    abortEarly: false,
                    errors: {
                        wrap: {
                            label: false,
                        },
                    },
                }),
                failAction: invalidField,
            },
            pre: [
                {
                    method: canEditDestination,
                },
            ],
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                }),
            },
        },

        handler: controller.editDestination.bind(controller),
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
                        name: Joi.string(),
                        province: Joi.string(),
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
                    province: Joi.any()
                        .allow(...getProvince().map((e) => e.name))
                        .messages({
                            'any.only': 'Invalid province',
                        }),
                    name: Joi.string(),
                    filter: Joi.alternatives()
                        .try(Joi.array().items(Joi.string()), Joi.string())
                        .optional(),
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
                            created_at: Joi.date(),
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
                    data: Joi.object({
                        id: Joi.number(),
                        name: Joi.string(),
                        detail: Joi.string(),
                        location: Joi.string(),
                        image: Joi.string(),
                        province: Joi.string(),
                    }),
                }),
            },
        },

        handler: controller.addRating.bind(controller),
    },
    {
        method: ['DELETE'],
        path: '/api/destination/{postId}',
        options: {
            auth: 'accessToken',
            tags: ['api', 'destination'],
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
            pre: [{ method: canDeleteDestination }],
        },

        handler: controller.deleteDestination.bind(controller),
    },
];
