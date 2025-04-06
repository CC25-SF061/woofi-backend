import { Kysely, sql } from 'kysely';

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function create(db) {
    await sql`
	CREATE OR REPLACE FUNCTION report_dangling_image()
	RETURNS trigger AS  $$
	declare
	BEGIN 
		IF (TG_OP = 'UPDATE') THEN
			INSERT INTO dangling_image(image) VALUES (OLD.image);
			RETURN NEW;
		ELSEIF (TG_OP = 'DELETE') THEN
			INSERT INTO dangling_image(image) VALUES (OLD.image);
			RETURN OLD;
		END IF;
	END
	$$ LANGUAGE plpgsql
			`.execute(db);

    await sql`
	CREATE OR REPLACE TRIGGER report_update_destination
	BEFORE UPDATE OF image ON destination
	FOR EACH ROW 
	WHEN (OLD.image IS DISTINCT FROM NEW.image)
	EXECUTE FUNCTION report_dangling_image()
	`.execute(db);

    await sql`
	CREATE OR REPLACE TRIGGER report_delete_destination
	BEFORE DELETE ON destination
	FOR EACH ROW 
	EXECUTE FUNCTION report_dangling_image()
	`.execute(db);
}
