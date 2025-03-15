import axios from 'axios';
const GEONAMES_API_URL = `http://api.geonames.org/searchJSON`;

export async function searchLocation(search) {
    const location = await axios.get(GEONAMES_API_URL, {
        params: {
            country: 'ID',
            username: process.env.GEONAME_USERNAME,
            q: search,
            featureCode: 'ADM1',
        },
    });

    return {
        totalResult: location.data.totalResultsCount,
        location: location.data.geonames.map((e) => e.name),
    };
}
