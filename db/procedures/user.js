import { Kysely, sql } from 'kysely';

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function create(db) {
    await sql`
    CREATE OR REPLACE FUNCTION report_dangling_image_user()
    RETURNS trigger AS  $$
    declare
    BEGIN 
        IF (TG_OP = 'UPDATE') THEN
            INSERT INTO dangling_image(image) VALUES (OLD.profile_image);
            RETURN NEW;
        ELSEIF (TG_OP = 'DELETE') THEN
            INSERT INTO dangling_image(image) VALUES (OLD.profile_image);
            RETURN OLD;
        END IF;
    END
    $$ LANGUAGE plpgsql
            `.execute(db);

    await sql`
    CREATE OR REPLACE TRIGGER report_update_user
    BEFORE UPDATE OF profile_image ON "user"
    FOR EACH ROW 
    WHEN (OLD.profile_image IS DISTINCT FROM NEW.profile_image)
    EXECUTE FUNCTION report_dangling_image_user()
    `.execute(db);
}
