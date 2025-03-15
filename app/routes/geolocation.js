import Joi from 'joi';
import { GeoLocationController } from '../controllers/GeoLocationController.js';
import { invalidField } from '../util/errorHandler.js';

const controller = new GeoLocationController();
/**
 * @type {import("@hapi/hapi").ServerRoute[]}
 */
export default [
    {
        method: ['GET'],
        path: '/api/geolocation/search',
        options: {
            tags: ['api', 'geolocation'],
            validate: {
                query: Joi.object({
                    q: Joi.string(),
                }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.object({
                        totalResult: Joi.number().integer(),
                        location: Joi.array().items(Joi.string()),
                    }),
                }),
            },
        },
        handler: controller.getLocation.bind(controller),
    },
];
