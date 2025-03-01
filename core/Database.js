import {  Kysely, PostgresDialect } from "kysely"
import pg from "pg"

const {Pool} = pg;  
/**
 * @type {Kysely<import("kysely-codegen").DB>}
 */
const dialect =new Kysely({
    dialect: new PostgresDialect({
        pool: new Pool({
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_DATABASE
        })
    })
});

/**
 * 
 * @returns {typeof dialect}
 */
export function getDatabase(){
    return dialect;
}