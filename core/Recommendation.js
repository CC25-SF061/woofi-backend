import { sql } from 'kysely';
import { getDatabase } from './Database.js';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.ML_URL,
});
export async function getRecommendation(
    userId,
    { page = 0, province, name, category }
) {
    const db = getDatabase();
    if (!userId) {
        return [];
    }
    const user = await db
        .selectFrom('user as u')
        .leftJoin('personal_data', 'personal_data.user_id', 'u.id')
        .where('u.id', '=', userId)
        .selectAll('u')
        .select([sql`date_part('year',age(birth_date))`.as('age'), 'gender'])
        .select([
            jsonArrayFrom(
                db
                    .selectFrom('personal_interest as pi')
                    .where('pi.user_id', '=', userId)
                    .select('interest')
            ).as('interest'),
        ])
        .executeTakeFirst();
    const milisToDay = (milis) => {
        return Math.floor(milis / 1000 / 60 / 60 / 24);
    };
    const created = Date.now() - user.created_at.getTime();
    const response = await axiosInstance.post('/rekomendasi-user', {
        is_new_user: milisToDay(created) < 3,
        gender: user.gender === 'male' ? 0 : 1,
        age: user.age,
        interest: user.interest.map((e) => e.interest),
    });
    const limit = 3;
    let result = response.data.rekomendasi;
    if (province) {
        result = result.filter((e) => e.Provinsi === province);
    }

    if (name) {
        result = result.filter((e) =>
            e.NameLocation.toLowerCase().startsWith(name.toLowerCase())
        );
    }

    if (category) {
        result = result.filter((e) => e.interest === category);
    }

    result = result
        .slice(limit * page, limit * page + limit)
        .sort((a) => {
            if (!a) {
                return 1;
            }
        })
        .map((e) => Object.assign(e, { isAIGenerated: true }));
    return result;
}
