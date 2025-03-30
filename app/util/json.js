/**
 * @param {object} object
 */
export function JSONToString(object) {
    return JSON.stringify(object, (_, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }

        return value;
    });
}
