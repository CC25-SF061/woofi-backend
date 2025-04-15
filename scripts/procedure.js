import 'dotenv/config';
import { getDatabase, getPool } from '../core/Database.js';
import { FileModulesProvider } from '../core/FileModulesProvider.js';

const modules = await new FileModulesProvider(
    'db/procedures/**/*.js'
).getMigrations();
const db = getDatabase();
const targetName = process.argv[2] || 'all';

for (const moduleName in modules) {
    if (targetName === 'all' || moduleName === targetName)
        await modules[moduleName].create(db);
}

process.exit(0);
