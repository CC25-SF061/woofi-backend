import Joi from 'joi';
import { ProfileController } from '../controllers/ProfileController.js';

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
];
