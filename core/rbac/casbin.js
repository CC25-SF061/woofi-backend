import { newEnforcer } from 'casbin';
import { getPool } from '../Database.js';
import { BasicAdapter } from 'casbin-basic-adapter';
import path from 'path';

const casbinTableName = 'rbac';
const __dirname = import.meta.dirname;
const adapter = await BasicAdapter.newAdapter('pg', getPool(), casbinTableName);

const enforcer = await newEnforcer(
    path.join(__dirname, 'rbac_model.conf'),
    adapter
);

/**
 *
 * @returns {typeof enforcer}
 */
export function getEnforcer() {
    return enforcer;
}
