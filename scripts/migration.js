import 'dotenv/config';
import { dirname } from 'path';
import pg from 'pg';
import { Kysely, Migrator, PostgresDialect } from 'kysely';
import { fileURLToPath } from 'url';
import { FileModulesProvider } from '../core/FileModulesProvider.js';

const { Pool } = pg;

let pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**@type  {Kysely<import('kysely-codegen').DB>}*/
const db = new Kysely({
    log(event) {
        console.log(event.query.sql);
    },
    dialect: new PostgresDialect({ pool }),
});
const migrator = new Migrator({
    db,
    provider: new FileModulesProvider('db/migrations/**/*.js'),
    allowUnorderedMigrations: true,
});

async function migrateUp() {
    const { error, results } = await migrator.migrateToLatest();

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
    for (let i = 0; i < (await migrator.getMigrations()).length; i++) {
        const { error, results } = await migrator.migrateDown();

        results?.forEach((it, i) => {
            console.log('it', i);
            if (it.status === 'Success') {
                console.log(
                    `migration "${it.migrationName}" was executed successfully`
                );
            } else if (it.status === 'Error') {
                console.error(
                    `failed to execute migration "${it.migrationName}"`
                );
            }
        });

        if (error) {
            console.error('failed to migrate');
            console.error(error);
        }
    }
}

const arg = process.argv[2];

if (arg === 'down') {
    await migrateDown();
} else {
    await migrateUp();
}

await db.destroy();
