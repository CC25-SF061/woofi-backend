import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
/**
 * @type {Kysely<import("kysely-codegen").DB>}
 */
const dialect = new Kysely({
    dialect: new PostgresDialect({
        pool,
    }),
});

/**
 *
 * @returns {typeof pool}
 */
export function getPool() {
    return pool;
}
/**
 *
 * @returns {typeof dialect}
 */
export function getDatabase() {
    return dialect;
}
