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
            .select([
                'id',
                'email',
                'is_verified',
                'name',
                'username',
                'profile_image',
            ])
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
        return h.response({
            success: true,
            message: 'Success getting profile',
            data: {
                id: user.id.toString(),
                profileImage: user.profile_image,
                username: user.username,
                email: user.email,
                name: user.name,
                isVerified: user.is_verified,
            },
        });
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getWhislists(request, h) {
        const { credentials } = request.auth;
        const db = this.db;
        let destination = db
            .selectFrom('whislist as w')
            .leftJoin('destination as d', 'd.id', 'w.destination_id')
            .leftJoin('rating_destination as rd', 'd.id', 'rd.destination_id')
            .where('w.user_id', '=', 1)
            .select((eb) => [
                eb.fn
                    .avg('rating_destination.score')
                    .over((ob) => ob.partitionBy('destination.id'))
                    .as('rating'),
                'd.id',
                'd.created_at',
                'd.detail',
                'd.image',
                'd.location',
                'd.user_id',
            ])
            .distinct()
            .execute();
    }
}
