import Joi from 'joi';
import { ProfileController } from '../controllers/ProfileController.js';
import { invalidField } from '../util/errorHandler.js';
import { isBannedRequest } from '../middleware/auth.js';
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
                    success: Joi.boolean(),
                    message: Joi.string(),
                }),
            },
            handler: controller.editEmail.bind(controller),
            pre: [{ method: isBannedRequest }],
        },
    },
    {
        method: ['PATCH'],
        path: '/api/user/edit/password',
        options: {
            tags: ['api', 'profile', 'user'],
            auth: 'accessToken',
            validate: {
                payload: Joi.object({
                    oldPassword: Joi.string().required().label('old password'),
                    newPassword: Joi.string().required().label('new password'),
                    confirmationPassword: Joi.string()
                        .required()
                        .equal(Joi.ref('newPassword'))
                        .messages({
                            'any.only': 'password confirmation must be equal',
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
                    success: Joi.boolean(),
                    message: Joi.string(),
                }),
            },
            handler: controller.editPassword.bind(controller),
            pre: [{ method: isBannedRequest }],
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
            pre: [{ method: isBannedRequest }],
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
            pre: [{ method: isBannedRequest }],
        },
    },
    {
        method: ['PATCH'],
        path: '/api/user/edit/profile-picture',
        options: {
            tags: ['api', 'profile', 'user'],
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
                }).options({
                    abortEarly: false,
                    stripUnknown: true,
                    errors: { wrap: { label: false } },
                }),
                failAction: invalidField,
            },
            handler: controller.editProfilePicture.bind(controller),
            response: {
                failAction: 'log',
                schema: Joi.object({
                    success: Joi.boolean(),
                    message: Joi.string(),
                    data: Joi.object({ image: Joi.string() }),
                }),
            },

            pre: [{ method: isBannedRequest }],
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

    {
        method: ['POST'],
        path: '/api/user/interest',
        options: {
            tags: ['api', 'user'],
            auth: 'accessToken',
            handler: controller.personalData.bind(controller),
            validate: {
                payload: Joi.object({
                    gender: Joi.string()
                        .required()
                        .valid('male', 'female')
                        .messages({
                            'any.only': 'Invalid gender',
                        }),
                    birth_date: Joi.date().required(),
                    interests: Joi.array()
                        .min(1)
                        .items(
                            Joi.string()
                                .valid(
                                    ...[
                                        'Peak',
                                        'Mountain',
                                        'Forest',
                                        'Beach',
                                        'Waterfall',
                                        'Lake',
                                        'Museum',
                                        'Recreational Park',
                                        'Tourist Village',
                                        'Others',
                                    ]
                                )
                                .messages({
                                    'any.only': 'Invalid interest',
                                })
                        )
                        .required(),
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
                    success: Joi.boolean(),
                    message: Joi.string(),
                }),
            },
        },
    },

    {
        method: ['GET'],
        path: '/api/user/profile/notifications',
        options: {
            tags: ['api', 'user', 'profile'],
            auth: 'accessToken',
            handler: controller.getNotifications.bind(controller),

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
        path: '/api/user/profile/mark-notification',
        options: {
            tags: ['api', 'user', 'profile'],
            auth: 'accessToken',
            handler: controller.updateNotificationRead.bind(controller),
            validate: {
                payload: Joi.object({
                    notificationIds: Joi.array().items(Joi.number()).required(),
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
                    success: Joi.boolean(),
                    message: Joi.string(),
                }),
            },
        },
    },
];
