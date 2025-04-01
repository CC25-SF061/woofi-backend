import { getDatabase } from './Database.js';

/**
 * @returns
 */
export async function getProvince() {
    const db = getDatabase();

    return await db
        .selectFrom('province')
        .select(['lat', 'long', 'name'])
        .execute();
}
