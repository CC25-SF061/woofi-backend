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
        path: '/api/geolocation/provinces',
        options: {
            tags: ['api', 'geolocation'],

            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.array().items(
                        Joi.object({
                            name: Joi.string(),
                            lat: Joi.number(),
                            long: Joi.number(),
                        })
                    ),
                }),
            },
        },
        handler: controller.getLocation.bind(controller),
    },
];
