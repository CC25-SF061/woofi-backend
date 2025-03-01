import { glob } from 'glob';
import { pathToFileURL } from 'url';

export class FileMigrationProvider {
    /**
     * @type {string}
     */
    #pattern;
    /**
     *
     * @param {string} globPattern
     */
    constructor(globPattern) {
        this.#pattern = globPattern;
    }

    /**
     * @returns {Promise<Record<string,import("kysely").Migration>}
     */
    async getMigrations() {
        const migrations = {};
        const files = await glob(this.#pattern, {
            withFileTypes: true,
            exclude: ['node_modules'],
        });
        const mappedMigration = await Promise.all(
            files.map((file) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const module = await import(
                            pathToFileURL(file.fullpath()).href
                        );
                        resolve({
                            path: file.name,
                            module,
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            })
        );
        mappedMigration.forEach((migration) => {
            migrations[
                migration.path.substring(0, migration.path.lastIndexOf('.'))
            ] = migration.module;
        });

        return migrations;
    }
}
