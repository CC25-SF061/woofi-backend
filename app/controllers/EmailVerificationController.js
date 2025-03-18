import { getDatabase } from '../../core/Database.js';
import Boom from '@hapi/boom';
import errorConstant from '../../core/ErrorConstant.js';
import { transport } from '../../core/Mailer.js';
import { generateOTP } from '../util/generateOTP.js';
import { emailVerificationConfig } from '../../config/otp.js';
import { badRequest } from '../util/errorHandler.js';
import { generateAccessToken } from '../util/generateAuthToken.js';

export class EmailVerificationController {
    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async verifyEmail(request, h) {
        try {
            const { payload } = request;

            const db = getDatabase();

            const user = await db
                .selectFrom('user')
                .select(['id', 'email', 'is_verified'])
                .where('email', '=', payload.email)
                .executeTakeFirst();

            const successResponse = h.response({
                success: true,
                message: 'Success sending OTP',
            });
            if (!user || user.is_verified) {
                return successResponse;
            }
            const otp = generateOTP();
            const transporter = transport();

            await db
                .deleteFrom('email_verification')
                .where('user_id', '=', user.id)
                .execute();
            await db
                .insertInto('email_verification')
                .values({
                    otp: otp,
                    user_id: user.id,
                    expired_at: new Date(
                        Date.now() + emailVerificationConfig.ttl * 1000
                    ),
                })
                .execute();

            await transporter.sendMail({
                from: '"Tourism" <no-reply@example.com>',
                to: payload.email,
                text: `Your Verification CODE:  ${otp}`,
                subject: 'Email Verification',
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
    async verifyEmailHandler(request, h) {
        try {
            const { payload } = request;

            const db = getDatabase();
            const sql = db
                .selectFrom('email_verification')
                .innerJoin('user', 'user.id', 'email_verification.user_id')
                .where('otp', '=', payload.otp)
                .where('user.email', '=', payload.email)
                .select(['expired_at', 'user_id']);

            const verification = await sql.executeTakeFirst();
            if (
                !verification ||
                verification.expired_at.getTime() < Date.now()
            ) {
                return badRequest(h, 'Invalid OTP', {
                    errCode: errorConstant.ERR_INVALID_OTP,
                });
            }

            const user = await db
                .updateTable('user')
                .set({
                    is_verified: true,
                })
                .where('id', '=', verification.user_id)
                .returningAll()
                .executeTakeFirst();

            await db
                .deleteFrom('email_verification')
                .where('user_id', '=', user.id)
                .execute();

            return h.response({
                success: true,
                message: 'Success Verify Email',
                data: {
                    token: generateAccessToken(
                        user.id.toString(),
                        user.is_verified
                    ),
                    id: user.id.toString(),
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    isVerified: user.is_verified,
                },
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
