export const type = {
    NEWEST: 'NEWEST',
    OLDEST: 'OLDEST',
    HIGHEST_RATING: 'HIGHEST_RATING',
    WRITTEN_BY_YOU: 'WRITTEN_BY_YOU',
};

/**
 *
 * @param {string[]} filter
 * @returns {Partial<typeof type>}
 */
export function mapFilter(filter = []) {
    const filterObj = {};
    if (typeof filter === 'string') {
        filter = [filter];
    }

    filter.forEach((filter) => {
        if (!type[filter]) return;

        if (type[type.NEWEST] === filter && filterObj[type.OLDEST]) {
            delete type[type.OLDEST];
        }

        if (type[type.OLDEST] === filter && filterObj[type.NEWEST]) {
            delete type[type.NEWEST];
        }

        filterObj[filter] = filter;
    });

    return filterObj;
}
