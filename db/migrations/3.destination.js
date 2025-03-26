import { Kysely, sql } from 'kysely';

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
    await db.schema
        .createTable('destination')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('detail', 'text', (col) => col.notNull())
        .addColumn('name', 'varchar(50)', (col) => col.notNull())
        .addColumn('image', 'varchar(255)', (col) => col.notNull())
        .addColumn('location', 'varchar(100)', (col) => col.notNull())
        .addColumn('user_id', 'bigint', (col) => col.references('user.id'))
        .addColumn('created_at', 'timestamptz', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .addColumn('updated_at', 'timestamptz', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .addColumn('deleted_at', 'timestamptz')
        .execute();

    await db.schema
        .createTable('rating_destination')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull().unique()
        )
        .addColumn('destination_id', 'bigint', (col) =>
            col.references('destination.id').notNull()
        )
        .addColumn('score', 'double precision', (col) => col.notNull())
        .execute();

    await db.schema
        .createTable('whislist')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull()
        )
        .addColumn('destination_id', 'bigint', (col) =>
            col.references('destination.id').notNull()
        )
        .execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
    await db.schema.dropTable('whislist').execute();

    await db.schema.dropTable('rating_destination').execute();
    await db.schema.dropTable('destination').execute();
}
