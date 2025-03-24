import { Kysely, sql } from 'kysely';

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
    await sql`
    CREATE OR REPLACE FUNCTION delete_post(postId bigint)
	RETURNS void AS  $$
	BEGIN 
		DELETE FROM rating_destination WHERE  postId = destination_id;
		DELETE FROM destination WHERE posId = id;
	END
	$$ LANGUAGE plpgsql
        `.execute(db);
}
