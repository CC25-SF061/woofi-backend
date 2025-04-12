import Joi from 'joi';
import { ContactController } from '../controllers/ContactController.js';
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
                    type: Joi.string().allow(null),
                    reply_id: Joi.number().allow(null),
                }).options({
                    abortEarly: false,
                    stripUnknown: true,
                    errors: {
                        wrap: { label: false },
                    },
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
        handler: controller.contact.bind(controller),
    },
];
