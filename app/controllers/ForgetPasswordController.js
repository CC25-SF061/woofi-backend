import { getDatabase } from '../../core/Database.js';
import Boom from '@hapi/boom';
import errorConstant from '../../core/ErrorConstant.js';
import { transport } from '../../core/Mailer.js';
import { generateOTP } from '../util/generateOTP.js';
import { forgetPasswordConfig } from '../../config/otp.js';
import { badRequest } from '../util/errorHandler.js';
import { COOKIE_DATA_NAME } from '../../config/cookie.js';
import { sha256 } from 'js-sha256';
import bcrypt from 'bcrypt';

export class ForgetPasswordController {
    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async forgetPassword(request, h) {
        try {
            const { payload } = request;

            const db = getDatabase();

            const user = await db
                .selectFrom('user')
                .select(['id', 'email'])
                .where('email', '=', payload.email)
                .executeTakeFirst();
            const hash = sha256.hmac(process.env.APP_KEY, payload.email);
            const successResponse = h.response({
                success: true,
                message: 'Success sending OTP',
                data: {
                    hash,
                },
            });
            if (!user) {
                return successResponse;
            }
            const otp = generateOTP();
            const transporter = transport();

            await db
                .deleteFrom('forget_password')
                .where('user_id', '=', user.id)
                .execute();
            await db
                .insertInto('forget_password')
                .values({
                    otp: otp,
                    user_id: user.id,
                    hash: hash,
                    expired_at: new Date(
                        Date.now() + forgetPasswordConfig.ttl * 1000
                    ),
                })
                .execute();

            transporter.sendMail({
                from: '"Woofi" <no-reply@woofi.com>',
                to: payload.email,
                text: `Your OTP CODE:  ${otp}`,
                subject: 'Password Reset Code',
            });

            return successResponse;
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async verifyForgetPassword(request, h) {
        try {
            const { payload } = request;
            const db = getDatabase();
            const resetPasswordOTP = await db
                .selectFrom('forget_password')
                .innerJoin('user', 'user.id', 'forget_password.user_id')
                .where('otp', '=', payload.otp)
                .where('forget_password.hash', '=', payload.hash)
                .select(['expired_at', 'user_id'])
                .executeTakeFirst();

            if (
                !resetPasswordOTP ||
                resetPasswordOTP.expired_at.getTime() < Date.now()
            ) {
                return badRequest(h, 'Invalid OTP', {
                    errCode: errorConstant.ERR_INVALID_OTP,
                });
            }

            return h.response({
                success: true,
                message: 'Valid OTP',
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async resendOTP(request, h) {
        try {
            const { payload } = request;

            const db = getDatabase();

            const forgetPassword = await db
                .selectFrom('forget_password')
                .selectAll()
                .where('hash', '=', payload.hash)
                .innerJoin('user', 'user.id', 'forget_password.user_id')
                .select(['forget_password.id', 'user.email'])
                .executeTakeFirst();
            const successResponse = h.response({
                success: true,
                message: 'Success sending OTP',
            });
            if (!forgetPassword) {
                return successResponse;
            }
            const otp = generateOTP();
            const transporter = transport();

            await db
                .updateTable('forget_password')
                .set({
                    expired_at: new Date(
                        Date.now() + forgetPasswordConfig.ttl * 1000
                    ),
                    otp: otp,
                })
                .where('forget_password.id', '=', forgetPassword.id)
                .execute();

            transporter.sendMail({
                from: '"Woofi" <no-reply@woofi.com',
                to: forgetPassword.email,
                text: `Your OTP CODE:  ${otp}`,
                subject: 'Password Reset Code',
            });

            return successResponse;
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async resetPassword(request, h) {
        try {
            const { payload } = request;

            const db = getDatabase();
            const resetPasswordOTP = await db
                .selectFrom('forget_password')
                .innerJoin('user', 'user.id', 'forget_password.user_id')
                .where('forget_password.hash', '=', payload?.hash)
                .select(['expired_at', 'user_id', 'otp'])
                .executeTakeFirst();
            if (
                !resetPasswordOTP ||
                resetPasswordOTP.otp.toString() !== payload.otp ||
                resetPasswordOTP.expired_at.getTime() < Date.now()
            ) {
                return badRequest(h, 'Invalid OTP', {
                    errCode: errorConstant.ERR_INVALID_OTP,
                });
            }

            const user = await db
                .updateTable('user')
                .set({
                    password: await bcrypt.hash(
                        payload.password,
                        parseInt(process.env.BCRYPT_HASH_ROUND)
                    ),
                })
                .where('id', '=', resetPasswordOTP.user_id)
                .returning([
                    'id',
                    'username',
                    'email',
                    'name',
                    'is_verified',
                    'profile_image',
                ])
                .executeTakeFirst();

            await db
                .deleteFrom('forget_password')
                .where('user_id', '=', user.id)
                .execute();

            return h
                .response({
                    success: true,
                    message: 'Success Change password',
                })
                .unstate(COOKIE_DATA_NAME);
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
