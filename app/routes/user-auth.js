import Joi from 'joi';
import { AuthController } from '../controllers/AuthController.js';
import { invalidField } from '../util/errorHandler.js';
import { EmailVerificationController } from '../controllers/EmailVerificationController.js';
import { ForgetPasswordController } from '../controllers/ForgetPasswordController.js';

const authController = new AuthController();
const emailVerificationController = new EmailVerificationController();
const forgetPasswordController = new ForgetPasswordController();
/**
 * @type {import("@hapi/hapi").ServerRoute[]}
 */
export default [
    {
        method: ['POST'],
        path: '/api/auth/logout',
        options: {
            auth: 'accessToken',
            tags: ['api', 'auth'],
            state: {
                parse: true,
                failAction: 'error',
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    success: Joi.boolean(),
                    message: Joi.string(),
                }),
            },
        },
        handler: authController.logout.bind(authController),
    },
    {
        method: ['GET'],
        path: '/api/auth/refresh-token',
        options: {
            tags: ['api', 'auth'],
            state: {
                parse: true,
                failAction: 'error',
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    success: Joi.boolean(),
                    message: Joi.string(),
                    data: Joi.object({
                        token: Joi.string(),
                    }),
                }),
            },
        },
        handler: authController.refreshToken.bind(authController),
    },
    {
        method: ['POST'],
        path: '/api/auth/register',
        options: {
            tags: ['api', 'auth'],
            validate: {
                payload: Joi.object({
                    username: Joi.string()
                        .min(1)
                        .pattern(/^[\w_\.\-]*$/)
                        .required()
                        .messages({
                            'string.pattern.base':
                                '{#label} can only contain alphanumeric character, underscore, hypen, or underscore',
                        }),
                    name: Joi.string().min(1).required(),
                    email: Joi.string().email().required(),
                    password: Joi.string().min(8).required(),
                    passwordConfirmation: Joi.string()
                        .required()
                        .equal(Joi.ref('password'))
                        .messages({
                            'any.only': 'Password must be same',
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
                    success: Joi.bool(),
                    message: Joi.string(),
                    data: Joi.object({
                        id: Joi.string(),
                        email: Joi.string(),
                        username: Joi.string(),
                        name: Joi.string(),
                        token: Joi.string(),
                        isVerified: Joi.boolean(),
                    }),
                }),
            },
        },
        handler: authController.register.bind(authController),
    },
    {
        method: ['POST'],
        path: '/api/auth/login',
        handler: authController.login.bind(authController),
        options: {
            tags: ['api', 'auth'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().min(1).required(),
                }).options({ abortEarly: false, stripUnknown: true }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.object({
                        id: Joi.string(),
                        email: Joi.string(),
                        username: Joi.string(),
                        name: Joi.string(),
                        token: Joi.string(),
                        isVerified: Joi.boolean(),
                    }),
                }),
            },
        },
    },
    {
        method: ['POST'],
        path: '/api/auth/register/google',
        handler: authController.googleRegister.bind(authController),
        options: {
            tags: ['api', 'auth'],
            validate: {
                payload: Joi.object({
                    token: Joi.string().required(),
                }).options({ abortEarly: false, stripUnknown: true }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.object({
                        id: Joi.string(),
                        email: Joi.string(),
                        username: Joi.string(),
                        name: Joi.string(),
                        token: Joi.string(),
                        isVerified: Joi.boolean(),
                    }),
                }),
            },
        },
    },
    {
        method: ['POST'],
        path: '/api/auth/login/google',
        handler: authController.googleLogin.bind(authController),
        options: {
            tags: ['api', 'auth'],
            validate: {
                payload: Joi.object({
                    token: Joi.string().required(),
                }).options({ abortEarly: false, stripUnknown: true }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.object({
                        id: Joi.string(),
                        email: Joi.string(),
                        username: Joi.string(),
                        name: Joi.string(),
                        token: Joi.string(),
                        isVerified: Joi.boolean(),
                    }),
                }),
            },
        },
    },
    {
        method: ['POST'],
        path: '/api/auth/verify-email',
        handler: emailVerificationController.verifyEmail.bind(
            emailVerificationController
        ),
        options: {
            tags: ['api', 'email-verification'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
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
    },
    {
        method: ['POST'],
        path: '/api/auth/verify-email-handler',
        handler: emailVerificationController.verifyEmailHandler.bind(
            emailVerificationController
        ),
        options: {
            tags: ['api', 'email-verification'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
                    otp: Joi.string().required(),
                }).options({ abortEarly: false, stripUnknown: true }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.object({
                        id: Joi.string(),
                        email: Joi.string(),
                        username: Joi.string(),
                        name: Joi.string(),
                        isVerified: Joi.boolean(),
                    }),
                }),
            },
        },
    },
    {
        method: ['POST'],
        path: '/api/auth/forget-password',
        handler: forgetPasswordController.forgetPassword.bind(
            forgetPasswordController
        ),
        options: {
            tags: ['api', 'reset-password'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
                }).options({ abortEarly: false, stripUnknown: true }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: {
                        hash: Joi.string(),
                    },
                }),
            },
        },
    },
    {
        method: ['POST'],
        path: '/api/auth/verify-forget-password',
        handler: forgetPasswordController.verifyForgetPassword.bind(
            forgetPasswordController
        ),
        options: {
            tags: ['api', 'reset-password'],
            validate: {
                payload: Joi.object({
                    hash: Joi.string().required(),
                    otp: Joi.string().required(),
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
    },
    {
        method: ['POST'],
        path: '/api/auth/reset-password',
        handler: forgetPasswordController.resetPassword.bind(
            forgetPasswordController
        ),
        options: {
            tags: ['api', 'reset-password'],
            validate: {
                payload: Joi.object({
                    otp: Joi.string(),
                    hash: Joi.string(),
                    password: Joi.string().min(8).required(),
                    passwordConfirmation: Joi.string()
                        .required()
                        .valid(Joi.ref('password'))
                        .messages({
                            'any.only': 'Password must be same',
                        }),
                }).options({ abortEarly: false, stripUnknown: true }),
                failAction: invalidField,
            },
            response: {
                failAction: 'log',
                schema: Joi.object({
                    message: Joi.string(),
                    success: Joi.boolean(),
                    data: Joi.object({
                        id: Joi.string(),
                        email: Joi.string(),
                        username: Joi.string(),
                        name: Joi.string(),
                        isVerified: Joi.boolean(),
                    }),
                }),
            },
        },
    },
];
