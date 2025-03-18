import 'dotenv/config';
import { getDatabase, getPool } from '../core/Database.js';
import { FileModulesProvider } from '../core/FileModulesProvider.js';

const modules = await new FileModulesProvider(
    'db/seeders/**/*.js'
).getMigrations();
const db = getDatabase();
for (const moduleName in modules) {
    await modules[moduleName].seed(db);
}

process.exit(0);
