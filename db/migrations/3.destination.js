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
        .addColumn('province', 'varchar(50)', (col) => col.notNull())
        .addColumn('deleted_at', 'timestamptz')
        .execute();

    await db.schema
        .createTable('rating_destination')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull()
        )
        .addColumn('destination_id', 'bigint', (col) =>
            col.references('destination.id').notNull()
        )
        .addUniqueConstraint('unique_rating', ['destination_id', 'user_id'])
        .addColumn('score', 'double precision', (col) => col.notNull())
        .execute();

    await db.schema
        .createTable('wishlist')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull()
        )
        .addColumn('destination_id', 'bigint', (col) =>
            col.references('destination.id').notNull()
        )
        .execute();
    await db.schema
        .createTable('province')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())

        .addColumn('name', 'varchar(30)', (col) => col.notNull())
        .addColumn('lat', 'double precision', (col) => col.notNull())
        .addColumn('long', 'double precision', (col) => col.notNull())
        .execute();

    await db.schema
        .createTable('dangling_image')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('image', 'varchar(255)', (col) => col.notNull())
        .execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
    await db.schema.dropTable('province').execute();
    await db.schema.dropTable('wishlist').execute();

    await db.schema.dropTable('rating_destination').execute();
    await db.schema.dropTable('destination').execute();

    await db.schema.dropTable('dangling_image').execute();
}
