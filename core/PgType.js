import pg from 'pg';

const types = pg.types;
types.setTypeParser(types.builtins.INT2, (val) => {
    return val === null ? null : parseInt(val);
});
types.setTypeParser(types.builtins.INT4, (val) => {
    return val === null ? null : parseInt(val);
});
types.setTypeParser(types.builtins.INT8, (val) => {
    return val === null ? null : BigInt(val);
});
types.setTypeParser(types.builtins.BOOL, (val) => {
    switch (val) {
        case 'f':
            return false;
        case 't':
            return true;
        default:
            return null;
    }
});
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val) => {
    return val === null ? null : new Date(val);
});
