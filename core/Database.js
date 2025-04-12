import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

const { Pool } = pg;
let pool;
/**
 * @type {Kysely<import("kysely-codegen").DB>}
 */
let dialect;

/**
 *
 * @returns {typeof pool}
 */
export function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    return pool;
}
/**
 *
 * @returns {typeof dialect}
 */
export function getDatabase() {
    if (!dialect) {
        dialect = new Kysely({
            dialect: new PostgresDialect({
                pool: getPool(),
            }),
        });
    }

    return dialect;
}
