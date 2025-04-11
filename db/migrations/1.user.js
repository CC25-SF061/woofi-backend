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
        .addColumn('is_new_user', 'boolean', (col) =>
            col.defaultTo(sql`true`).notNull()
        )
        .addColumn('profile_image', 'varchar(255)')
        .execute();

    await db.schema
        .createTable('personal_data')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('gender', 'varchar(10)')
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull()
        )
        .addColumn('birth_date', 'timestamptz')
        .addUniqueConstraint('unique_personal_data', ['user_id'])
        .execute();

    await db.schema
        .createTable('personal_interest')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.notNull().references('user.id')
        )
        .addColumn('interest', 'varchar(50)', (col) => col.notNull())
        .addUniqueConstraint('unique_interest', ['user_id', 'interest'])
        .execute();
    await db.schema
        .createTable('destination_search')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.notNull().references('user.id')
        )
        .addColumn('count', 'bigint', (col) => col.defaultTo(0))
        .addColumn('name', 'varchar(50)', (col) => col.notNull())
        .addUniqueConstraint('destination_unique', ['user_id', 'name'])
        .execute();
    await db.schema
        .createTable('token')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull()
        )
        .addColumn('refresh_token', 'varchar(255)', (col) => col.notNull())
        .addColumn('expired_at', 'timestamptz', (col) => col.notNull())
        .execute();

    await db.schema
        .createTable('email_verification')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull()
        )
        .addColumn('otp', 'char(6)', (col) => col.notNull())
        .addColumn('expired_at', 'timestamptz', (col) => col.notNull())
        .execute();
    await db.schema
        .createTable('forget_password')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull()
        )
        .addColumn('hash', 'varchar(255)', (col) => col.notNull())
        .addColumn('otp', 'integer', (col) => col.notNull())
        .addColumn('expired_at', 'timestamptz', (col) => col.notNull())
        .execute();

    await db.schema
        .createTable('oauth')
        .addColumn('provider_user_id', 'varchar(100)', (col) => col.notNull())
        .addColumn('user_id', 'bigint', (col) =>
            col.references('user.id').notNull()
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

    await db.schema.createIndex('idx_rbac').on('rbac').column('v0').execute();
    await db.schema
        .createIndex('user_concat_string')
        .on('user')
        .expression(sql`('user::'|| "user"."id")`)
        .execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
    await db.schema.dropIndex('user_concat_string').execute();
    await db.schema.dropIndex('idx_rbac').execute();
    await db.schema.dropTable('personal_interest').execute();
    await db.schema.dropTable('personal_data').execute();
    await db.schema.dropTable('destination_search').execute();
    await db.schema.dropTable('email_verification').execute();
    await db.schema.dropTable('forget_password').execute();
    await db.schema.dropTable('token').execute();
    await db.schema.dropTable('oauth').execute();
    await db.schema.dropTable('rbac').execute();
    await db.schema.dropTable('user').execute();
}
