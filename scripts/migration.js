import 'dotenv/config';
import { dirname } from 'path';
import pg from 'pg';
import { Kysely, Migrator, PostgresDialect } from 'kysely';
import { fileURLToPath } from 'url';
import { FileMigrationProvider } from '../core/FileMigrationProvider.js';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

let pool;
if (process.env.APP_ENV === 'development') {
    pool = new Pool({
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
    });
} else if (process.env.APP_ENV === 'production') {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
}
/**@type  {Kysely<import('kysely-codegen').DB>}*/
const db = new Kysely({
    log(event) {
        console.log(event.query.sql);
    },
    dialect: new PostgresDialect({ pool }),
});
const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider('db/migrations/**/*.js'),
});

async function migrateUp() {
    const { error, results } = await migrator.migrateUp();

    results?.forEach((it, i) => {
        console.log('it', i);
        if (it.status === 'Success') {
            console.log(
                `migration "${it.migrationName}" was executed successfully`
            );
        } else if (it.status === 'Error') {
            console.error(`failed to execute migration "${it.migrationName}"`);
        }
    });

    if (error) {
        console.error('failed to migrate');
        console.error(error);
    }
}

async function migrateDown() {
    const { error, results } = await migrator.migrateDown();

    results?.forEach((it, i) => {
        console.log('it', i);
        if (it.status === 'Success') {
            console.log(
                `migration "${it.migrationName}" was executed successfully`
            );
        } else if (it.status === 'Error') {
            console.error(`failed to execute migration "${it.migrationName}"`);
        }
    });

    if (error) {
        console.error('failed to migrate');
        console.error(error);
    }
}

const arg = process.argv[2];

if (arg === 'down') {
    await migrateDown();
} else {
    await migrateUp();
}

await db.destroy();
