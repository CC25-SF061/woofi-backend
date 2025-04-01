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
        path: '/api/user/profile/whislists',
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
                            user_id: Joi.string(),
                        })
                    ),
                }),
            },
        },
        handler: controller.getWhislists.bind(controller),
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
        },
    },
];
