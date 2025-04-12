import 'dotenv/config';
import {
    createStringRole,
    createStringUser,
    getEnforcer,
} from './core/rbac/Casbin.js';

const enforcer = getEnforcer();

// await enforcer.addRoleForUser(createStringUser('3'), createStringRole('admin'));

console.log(await enforcer.enforce(createStringUser('54'), '*', 'admin'));
