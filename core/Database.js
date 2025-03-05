import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
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
