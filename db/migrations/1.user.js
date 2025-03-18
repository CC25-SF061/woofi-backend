import { Kysely, sql } from 'kysely';

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
    await db.schema
        .createTable('user')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('name', 'varchar(50)')
        .addColumn('email', 'varchar(255)', (col) => col.unique().notNull())
        .addColumn('username', 'varchar(50)', (col) => col.unique().notNull())
        .addColumn('password', 'char(60)')
        .addColumn('created_at', 'timestamptz', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .addColumn('updated_at', 'timestamptz', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .addColumn('is_verified', 'boolean', (col) =>
            col.defaultTo(sql`false`).notNull()
        )
        .execute();

    await db.schema
        .createTable('token')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').onDelete('cascade').notNull()
        )
        .addColumn('refresh_token', 'varchar(255)', (col) => col.notNull())
        .addColumn('expired_at', 'timestamptz', (col) => col.notNull())
        .execute();

    await db.schema
        .createTable('email_verification')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').onDelete('cascade').notNull()
        )
        .addColumn('otp', 'char(6)', (col) => col.notNull())
        .addColumn('expired_at', 'timestamptz', (col) => col.notNull())
        .execute();
    await db.schema
        .createTable('forget_password')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').onDelete('cascade').notNull()
        )
        .addColumn('otp', 'integer', (col) => col.notNull())
        .addColumn('expired_at', 'timestamptz', (col) => col.notNull())
        .execute();

    await db.schema
        .createTable('oauth')
        .addColumn('provider_user_id', 'varchar(100)', (col) => col.notNull())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').onDelete('cascade').notNull()
        )
        .addColumn('provider_name', 'varchar(25)', (col) => col.notNull())
        .execute();

    await db.schema
        .createTable('rbac')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('ptype', 'varchar(50)')
        .addColumn('v0', 'varchar(50)')
        .addColumn('v1', 'varchar(50)')
        .addColumn('v2', 'varchar(50)')
        .addColumn('v3', 'varchar(50)')
        .addColumn('v4', 'varchar(50)')
        .addColumn('v5', 'varchar(50)')
        .execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
    await db.schema.dropTable('email_verification').execute();
    await db.schema.dropTable('forget_password').execute();
    await db.schema.dropTable('token').execute();
    await db.schema.dropTable('oauth').execute();
    await db.schema.dropTable('rbac').execute();
    await db.schema.dropTable('user').execute();
}
