import Joi from 'joi';
import { ProfileController } from '../controllers/ProfileController.js';
import { invalidField } from '../util/errorHandler.js';
const controller = new ProfileController();
/**
 * @type {import("@hapi/hapi").ServerRoute[]}
 */
export default [
    {
        method: ['GET'],
        path: '/api/user/profile',
        options: {
            tags: ['api', 'profile'],
            auth: 'accessToken',
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: {
                        id: Joi.number(),
                        name: Joi.string(),
                        is_verified: Joi.boolean(),
                        username: Joi.string(),
                        email: Joi.string(),
                    },
                }),
            },
        },
        handler: controller.getProfile.bind(controller),
    },
    {
        method: ['GET'],
        path: '/api/user/profile/wishlists',
        options: {
            tags: ['api', 'profile'],
            auth: 'accessToken',
            response: {
                failAction: 'log',
                schema: Joi.object({
                    success: Joi.boolean(),
                    message: Joi.string(),
                    data: Joi.array().items(
                        Joi.object({
                            rating: Joi.number(),
                            id: Joi.number(),
                            created_at: Joi.date(),
                            detail: Joi.string(),
                            image: Joi.string(),
                            location: Joi.string(),
                            name: Joi.string(),
                        })
                    ),
                }),
            },
        },
        handler: controller.getWishlist.bind(controller),
    },
    {
        method: ['PATCH'],
        path: '/api/user/edit/email',
        options: {
            tags: ['api', 'profile', 'user'],
            auth: 'accessToken',
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
                }).options({ abortEarly: false, stripUnknown: true }),
                failAction: invalidField,
            },
            handler: controller.editEmail.bind(controller),
        },
    },
    {
        method: ['PATCH'],
        path: '/api/user/edit/username',
        options: {
            tags: ['api', 'profile', 'user'],
            auth: 'accessToken',
            validate: {
                payload: Joi.object({
                    username: Joi.string()
                        .pattern(/^[\w_\.\-]*$/)
                        .required()
                        .messages({
                            'string.pattern.base':
                                '{#label} can only contain alphanumeric character, underscore, hypen, or underscore',
                        }),
                }).options({
                    abortEarly: false,
                    stripUnknown: true,
                    errors: { wrap: { label: false } },
                }),
                failAction: invalidField,
            },
            handler: controller.editUsername.bind(controller),
            response: {
                failAction: 'log',
                schema: Joi.object({
                    success: Joi.boolean(),
                    message: Joi.string(),
                }),
            },
        },
    },
    {
        method: ['PATCH'],
        path: '/api/user/edit/name',
        options: {
            tags: ['api', 'profile', 'user'],
            auth: 'accessToken',
            validate: {
                payload: Joi.object({
                    name: Joi.string().required().min(1).max(20),
                }).options({
                    abortEarly: false,
                    stripUnknown: true,
                    errors: { wrap: { label: false } },
                }),
                failAction: invalidField,
            },
            handler: controller.editName.bind(controller),
            response: {
                failAction: 'log',
                schema: Joi.object({
                    success: Joi.boolean(),
                    message: Joi.string(),
                }),
            },
        },
    },
    {
        method: ['GET'],
        path: '/api/user/profile/destinations',
        options: {
            tags: ['api', 'profile', 'user'],
            auth: 'accessToken',
            handler: controller.getDestinations.bind(controller),
            response: {
                failAction: 'log',
                schema: Joi.object({
                    success: Joi.boolean(),
                    message: Joi.string(),
                    data: Joi.array().items(
                        Joi.object({
                            id: Joi.number(),
                            detail: Joi.string(),
                            image: Joi.string(),
                            name: Joi.string(),
                            province: Joi.string(),
                            location: Joi.string(),
                            rating: Joi.number(),
                            isWishlisted: Joi.boolean(),
                        })
                    ),
                }),
            },
        },
    },
];
