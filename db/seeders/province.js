import { Kysely } from 'kysely';

/**
 * @param {Kysely<import("kysely-codegen").DB} db
 * @returns {Promise<void>}
 */
export async function seed(db) {
    await db
        .insertInto('province')
        .values([
            {
                name: 'Aceh',
                lat: 4.695135,
                long: 96.749397,
            },
            {
                name: 'Sumatera Utara',
                lat: 2.1153547,
                long: 99.5450974,
            },
            {
                name: 'Sumatera Barat',
                lat: -0.7399397,
                long: 100.8000051,
            },
            {
                name: 'Riau',
                lat: 0.2933466,
                long: 101.7068294,
            },
            {
                name: 'Jambi',
                lat: -1.4851832,
                long: 102.438058,
            },
            {
                name: 'Sumatera Selatan',
                lat: -3.3194374,
                long: 104.9147137,
            },
            {
                name: 'Bengkulu',
                lat: -3.5778479,
                long: 102.3463875,
            },
            {
                name: 'Lampung',
                lat: -4.5585849,
                long: 105.4068079,
            },
            {
                name: 'Kepulauan Bangka Belitung',
                lat: -2.7410513,
                long: 106.4405872,
            },
            {
                name: 'Kepulauan Riau',
                lat: 3.7855849,
                long: 108.187775,
            },
            {
                name: 'Jakarta',
                lat: -6.2087634,
                long: 106.845599,
            },
            {
                name: 'Jawa Barat',
                lat: -6.889167,
                long: 107.64047,
            },
            {
                name: 'Jawa Tengah',
                lat: -7.150975,
                long: 110.1402594,
            },
            {
                name: 'Yogyakarta',
                lat: -7.7955798,
                long: 110.3694896,
            },
            {
                name: 'Jawa Timur',
                lat: -7.5360639,
                long: 112.2384017,
            },
            {
                name: 'Banten',
                lat: -6.4058172,
                long: 106.0640179,
            },
            {
                name: 'Bali',
                lat: -8.3405389,
                long: 115.0919509,
            },
            {
                name: 'Nusa Tenggara Barat',
                lat: -8.652933,
                long: 117.361649,
            },
            {
                name: 'Nusa Tenggara Timur',
                lat: -8.657382,
                long: 121.079369,
            },
            {
                name: 'Kalimantan Barat',
                lat: -0.1322314,
                long: 111.096318,
            },
            {
                name: 'Kalimantan Tengah',
                lat: -1.6814878,
                long: 113.3823545,
            },
            {
                name: 'Kalimantan Selatan',
                lat: -3.0926415,
                long: 115.2837585,
            },
            {
                name: 'Kalimantan Timur',
                lat: 0.5386592,
                long: 116.419389,
            },
            {
                name: 'Kalimantan Utara',
                lat: 3.0730922,
                long: 116.0413889,
            },
            {
                name: 'Sulawesi Utara',
                lat: 1.4300254,
                long: 124.1435021,
            },
            {
                name: 'Sulawesi Tengah',
                lat: -1.4300254,
                long: 121.4456179,
            },
            {
                name: 'Sulawesi Selatan',
                lat: -3.6687994,
                long: 119.9740534,
            },
            {
                name: 'Sulawesi Tenggara',
                lat: -4.1148958,
                long: 122.539603,
            },
            {
                name: 'Gorontalo',
                lat: 0.5435442,
                long: 123.0567693,
            },
            {
                name: 'Sulawesi Barat',
                lat: -2.8441371,
                long: 119.2320784,
            },
            {
                name: 'Maluku',
                lat: -3.2384616,
                long: 130.1452734,
            },
            {
                name: 'Maluku Utara',
                lat: 0.570556,
                long: 127.8087693,
            },
            {
                name: 'Papua',
                lat: -4.269928,
                long: 138.080352,
            },
            {
                name: 'Papua Barat',
                lat: -1.3361154,
                long: 133.1747162,
            },
            {
                name: 'Papua Tengah',
                lat: -3.976217,
                long: 137.364055,
            },
            {
                name: 'Papua Pegunungan',
                lat: -3.83548,
                long: 138.076844,
            },
            {
                name: 'Papua Selatan',
                lat: -7.639467,
                long: 139.703418,
            },
            {
                name: 'Papua Barat Daya',
                lat: -0.765369,
                long: 131.580059,
            },
        ])
        .execute();
}
