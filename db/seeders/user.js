import { Kysely, sql } from 'kysely';
import bcrypt from 'bcrypt';
import { fa, faker } from '@faker-js/faker';

const categories = [
    'Peak',
    'Mountain',
    'Forest',
    'Beach',
    'Waterfall',
    'Lake',
    'Museum',
    'Recreational Park',
    'Tourist Village',
    'Others',
];

const destinationName = [
    'Taman Nasional Gunung Leuser',
    'Pucok Krueng',
    'Pantai Ujong Kareung',
    'Pantai Lancok',
    'Air Terjun Peukan Biluy',
    'Tapak Tuan Tapa',
    'Mon Ceunong',
    'Pantai Ulee Lheue',
    'Bukit Siron',
    'Pantai Ujong Batee',
    'Air Terjun Kuta Malaka',
    'Putri Pukes Cave',
    'Wisata Gua Sarang',
    'Tugu Kupiah Teuku Umar',
    'Taman Rusa Aceh Besar',
    'Pantan Terong',
    'Desa Wisata Nusa, Aceh',
    'Brayeung, Leupung',
    'Air Terjun Terujak',
    'Bukit Lamreh',
    'Jantho Panorama Park',
    'Lhok Mata Ie Ujong Pancu',
    'Bukit Wisata Goa Jepang Lhokseumawe',
    'Ujung Nunang',
    'Wisata Air terjun suhom',
    'Wisata Panorama alam Bukit Jalin',
    'Desa Wisata Lubuk Sukon',
    'Panorama Gunong Keutapang',
    'Pantai Suak Ribee',
    'Tambatan Perahu Lot Kala',
    'Taman Hutan Raya Pocut Meurah Intan',
    'Bur Telege - Takengon',
    'Pantai Babah Kuala',
    'Pantai Lhok Kubu, Calang',
    'Air Terjun Mengaya',
    'Taman Sulthanah Safiatuddin Banda Aceh',
    'Pantai Sawang Biduk Buruak (SBB)',
    'Air Terjun Elnaja',
    'Waduk Jeulikat aceh',
    'Puncak Bukit Suharto',
    'Taman Putroe Phang',
    'Taman Batu Lepes',
    'Pantai pelangi matang Rayeuk pp',
    'Arung Jeram Lukup Badak',
    'Pemandian Air Panas "Ie Seueum" Aceh Besar',
    'Natural park takengon',
    'Air terjun ceuraceu alue teungoh',
    'Taman Bustanussalatin',
    'Monumen Kupiah Meukeutop Lama',
    'Pria Laot Waterfall',
];

function getRandomArbitrary(min, max) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    return Math.floor(random * (max - min) + min);
}

/**
 * @param {Kysely<import("kysely-codegen").DB} db
 * @returns {Promise<void>}
 */
export async function seed(db) {
    // if (process.env.APP_ENV === 'production') {
    //     return;
    // }
    const users = await Promise.all(
        Array.from({ length: 50 }, async () => {
            const user = await db
                .insertInto('user')
                .values({
                    name: faker.internet.displayName(),
                    is_verified: false,
                    username: faker.internet.username(),
                    email: faker.internet.email(),
                    password: bcrypt.hashSync(
                        faker.internet.password(),
                        parseInt(process.env.BCRYPT_HASH_ROUND)
                    ),
                })
                .returning('id')
                .executeTakeFirst();
            await db
                .insertInto('personal_data')
                .values({
                    gender: faker.person.sex(),
                    user_id: user.id,
                    birth_date: faker.date.birthdate({
                        min: 2000,
                        max: 2050,
                        mode: 'year',
                    }),
                })
                .execute();
            return user.id;
        })
    );

    await Promise.all(
        Array.from({ length: users.length }, async (_, userIndex) => {
            const temp = [...categories];
            const randomLength = getRandomArbitrary(2, temp.length);
            for (let i = 0; i < randomLength; i++) {
                let category = temp.splice(
                    getRandomArbitrary(0, temp.length),
                    1
                );
                await db
                    .insertInto('personal_interest')
                    .values({
                        user_id: users[userIndex],
                        interest: category[0],
                    })
                    .returning('id')
                    .executeTakeFirst();
            }
        })
    );

    await Promise.all(
        Array.from({ length: users.length }, async (_, index) => {
            const randomLength = getRandomArbitrary(2, 7);
            const destinationNameTemp = [...destinationName].map((name) => ({
                name: name,
                selectedCount: 0,
            }));
            for (let i = 0; i < randomLength; i++) {
                const destinationIdx = getRandomArbitrary(
                    0,
                    destinationName.length
                );
                const destination = destinationNameTemp[destinationIdx];
                await db
                    .insertInto('destination_search')
                    .values({
                        user_id: users[index],
                        name: destination.name,
                        count: getRandomArbitrary(1, 30),
                    })
                    .onConflict((oc) =>
                        oc.constraint('destination_unique').doUpdateSet({
                            count: sql`"destination_search"."count" + EXCLUDED."count"`,
                        })
                    )
                    .execute();
                if (destination.selectedCount++ > 2) {
                    console.log(destination.selectedCount, 'count');
                    destinationNameTemp.splice(destinationIdx, 1);
                }
            }
        })
    );

    // await Promise.all(
    //     Array.from({ length: 100 }, async () => {
    //         await db
    //             .insertInto('destination_search')
    //             .values({
    //                 user_id: users[getRandomArbitrary(0, users.length)],
    //                 name: destinationName[
    //                     getRandomArbitrary(0, destinationName.length)
    //                 ],
    //                 count: getRandomArbitrary(1, 100),
    //             })
    //             .onConflict((oc) =>
    //                 oc.column('name').doUpdateSet({
    //                     count: sql`"destination_search"."count" + EXCLUDED."count"`,
    //                 })
    //             )
    //             .execute();
    //     })
    // );
}
