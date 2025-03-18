import { Kysely, sql } from 'kysely';

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
    await db.schema
        .createTable('contact')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('message', 'varchar(1000)', (col) => col.notNull())
        .addColumn('name', 'varchar(50)', (col) => col.notNull())
        .addColumn('email', 'varchar(255)', (col) => col.notNull())
        .addColumn('reason', 'varchar(100)', (col) => col.notNull())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').onDelete('cascade')
        )
        .addColumn('created_at', 'timestamptz', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
    await db.schema.dropTable('contact').execute();
}
