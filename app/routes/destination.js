import { DestinationController } from '../controllers/DestinationController.js';
import Joi from 'joi';
import { invalidField } from '../util/errorHandler.js';
import { fileTypeFromBuffer } from 'file-type';
import { isWritter } from '../middleware/auth.js';
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
                maxBytes: 1048576 * 4,
            },
            tags: ['api', 'destination'],
            validate: {
                payload: Joi.object({
                    image: Joi.required()
                        .custom(async (value, h) => {
                            const fileType = await fileTypeFromBuffer(value);
                            if (
                                !['image/jpeg', 'image/png'].includes(
                                    fileType.mime
                                )
                            ) {
                                return h.error('any.invalid');
                            }
                            return value;
                        }, 'mime-type')

                        .required()
                        .messages({
                            'any.invalid': 'Invalid image must be png or jpeg',
                        })
                        .error((errors) => {
                            errors[0].value = 'REDACTED';
                            errors[0].local.value = 'REDACTED';
                            return errors;
                        }),
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
            pre: [{ method: isWritter }],
        },

        handler: controller.addPost.bind(controller),
    },
];
