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
            validate: {
                payload: Joi.object({
                    name: Joi.string().required(),
                    email: Joi.string().email().required(),
                    message: Joi.string().required(),
                    reason: Joi.string()
                        .required()
                        .valid(reason.CONTACT_REASON_CONTACT)
                        .messages({
                            'any.only': `invalid constant reason. Reason must be ${reason.CONTACT_REASON_CONTACT}`,
                        }),
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
        handler: controller.contact.bind(controller),
    },
    {
        method: ['POST'],
        path: '/api/contact/requestRoleWritter',
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
            pre: [{ method: isAdmin }],
        },
        handler: controller.getContacts.bind(controller),
    },
];
