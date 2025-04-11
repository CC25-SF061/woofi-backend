import { Kysely, sql } from 'kysely';

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
    await db.schema
        .createTable('notification_user')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('user_id', 'bigint', (col) => col.notNull())
        .addColumn('detail', 'text', (col) => col.notNull())
        .addColumn('is_read', 'boolean', (col) =>
            col.notNull().defaultTo(false)
        )
        .addColumn('from', 'varchar(50)', (col) => col.notNull())
        .addColumn('created_at', 'timestamptz', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .execute();
    await db.schema
        .createTable('notification_admin')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('detail', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamptz', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('expired_at', 'timestamptz', (col) => col.notNull())
        .addColumn('from', 'varchar(50)', (col) => col.notNull())
        .execute();
    await db.schema
        .createTable('notification_admin_read')
        .addColumn('id', 'bigserial', (col) => col.primaryKey())
        .addColumn('admin_id', 'bigint', (col) =>
            col.references('user.id').notNull()
        )
        .addColumn('notification_id', 'bigint', (col) =>
            col.references('notification_admin.id').notNull()
        )
        .addUniqueConstraint('unique_read', ['admin_id', 'notification_id'])
        .execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
    await db.schema.dropTable('notification_admin_read').execute();
    await db.schema.dropTable('notification_admin').execute();
    await db.schema.dropTable('notification_user').execute();
}
