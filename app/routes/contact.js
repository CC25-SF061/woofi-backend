import Joi from 'joi';
import { ContactController } from '../controllers/ContactController.js';
import { reason } from '../../core/ContactConstant.js';
import { invalidField } from '../util/errorHandler.js';
import { isAdmin } from '../middleware/auth.js';

const controller = new ContactController();
/**
 * @type {import("@hapi/hapi").ServerRoute[]}
 */
export default [
    {
        method: ['POST'],
        path: '/api/contact/add',
        options: {
            tags: ['api', 'contact'],
            auth: {
                strategy: 'accessToken',
                mode: 'optional',
            },
            validate: {
                payload: Joi.object({
                    name: Joi.string().required().messages({
                        'any.required': 'Name is required',
                    }),
                    email: Joi.string().email().required().messages({
                        'any.required': 'email is required',
                    }),
                    message: Joi.string().required().messages({
                        'any.required': 'message is required',
                    }),
                    reason: Joi.string().required().messages({
                        'any.required': 'reason is required',
                    }),
                }).options({ abortEarly: false, stripUnknown: true }),
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
        handler: controller.contact.bind(controller),
    },
    {
        method: ['POST'],
        path: '/api/contact/request-role-writter',
        options: {
            tags: ['api', 'contact'],
            auth: 'accessToken',
            validate: {
                payload: Joi.object({
                    message: Joi.string().required(),
                }).required(),
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
        handler: controller.requestRoleWritter.bind(controller),
    },
    {
        method: ['GET'],
        path: '/api/contacts',
        options: {
            tags: ['api', 'contact'],
            auth: 'accessToken',
            validate: {
                query: Joi.object({
                    reason: Joi.string(),
                    name: Joi.string(),
                    email: Joi.string(),
                    page: Joi.number().min(0).default(0),
                }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.array().items({
                        id: Joi.string(),
                        message: Joi.string(),
                        name: Joi.string(),
                        email: Joi.string(),
                        reason: Joi.string(),
                        user_id: Joi.string(),
                        created_at: Joi.string(),
                    }),
                }),
            },
            pre: [{ method: isAdmin }],
        },
        handler: controller.getContacts.bind(controller),
    },
];
