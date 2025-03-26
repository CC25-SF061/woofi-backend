import { getDatabase } from '../../core/Database.js';

export class ProfileController {
    /**@type {ReturnType<typeof getDatabase>} */
    db;
    constructor() {
        this.db = getDatabase();
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getProfile(request, h) {
        const { credentials } = request.auth;
        const db = this.db;

        const user = await db
            .selectFrom('user')
            .where('user.id', '=', credentials.id)
            .select(['id', 'email', 'is_verified', 'name', 'username'])
            .executeTakeFirst();
        JSON.stringify(
            {
                success: true,
                message: 'Success getting profile',
                data: user,
            },
            (_, val) => {
                if (typeof val === 'bigint') {
                    return val.toString();
                }

                return val;
            }
        );
        return h
            .response(
                JSON.stringify(
                    {
                        success: true,
                        message: 'Success getting profile',
                        data: user,
                    },
                    (_, val) => {
                        if (typeof val === 'bigint') {
                            return val.toString();
                        }

                        return val;
                    }
                )
            )
            .type('application/json');
    }
}
