import { Kysely } from 'kysely';
import { readFile } from 'fs/promises';
import path from 'path';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import fs from 'fs';
import mime from 'mime';
import { createPath, upload } from '../../core/FileUpload.js';
// import { createPath } from '../../core/FileUpload';

function getRandomArbitrary(min, max) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    return Math.floor(random * (max - min) + min);
}

/**
 * @param {Kysely<import("kysely-codegen").DB} db
 * @returns {Promise<void>}
 */
export async function seed(db) {
    if (!process.env.EXPENSIVE_SEED) {
        return;
    }
    const dirname = import.meta.dirname;
    const data = JSON.parse(
        await readFile(path.join(dirname, 'user.json'), 'utf8')
    );
    const users = (
        await Promise.all(
            data.map(async (data) => {
                if (!data?.gender) {
                    return;
                }
                const user = await db
                    .insertInto('user')
                    .values({
                        email: faker.internet.email(),
                        name: data.name,
                        username: faker.internet.username(),
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
                        birth_date: data.birth_date,
                        gender: data.gender,
                        user_id: user.id,
                    })
                    .execute();
                await db
                    .insertInto('personal_interest')
                    .values(
                        data.interest.map((interest) => ({
                            interest: interest,
                            user_id: user.id,
                        }))
                    )
                    .execute();

                await db
                    .insertInto('destination_search')
                    .values(
                        data.searchs.map((search) => ({
                            count: search.count,
                            name: search.name,
                            user_id: user.id,
                        }))
                    )
                    .execute();

                return user.id;
            })
        )
    ).filter((data) => (data ? true : false));

    const destinationData = JSON.parse(
        await readFile(path.join(dirname, './dataDestination/destination.json'))
    );

    try {
        await Promise.all(
            destinationData.map(async (data) => {
                const stream = fs.createReadStream(
                    path.join(dirname, './dataDestination', data.link_image)
                );
                const pathImage = createPath(
                    mime.getExtension(mime.getType(data.link_image)),
                    'images'
                );
                // const path = createPath();
                upload(pathImage, stream, mime.getType(data.link_image));
                const randomUser = users[getRandomArbitrary(0, users.length)];
                const destination = await db
                    .insertInto('destination')
                    .values({
                        category: data.category.name,
                        detail: data.description,
                        province: data.province.name,
                        location: data.location,
                        user_id: randomUser,
                        name: data.destination_name,
                        image: pathImage,
                    })
                    .returning('id')
                    .execute();
                return destination.id;
            })
        );

        const topDestinations = await Promise.all([
            db
                .selectFrom('destination')
                .where('name', '=', 'Bromo Mountain')
                .select('id')
                .executeTakeFirst(),
            db
                .selectFrom('destination')
                .where('name', '=', 'Raja Ampat')
                .select('id')
                .executeTakeFirst(),
            db
                .selectFrom('destination')
                .where('name', '=', 'Komodo Island')
                .select('id')
                .executeTakeFirst(),
        ]);
        await Promise.all([
            topDestinations.map(async (e) => {
                const randomLength = getRandomArbitrary(30, users.length);
                await Promise.all(
                    users.slice(0, randomLength).map(async (user) => {
                        await db
                            .insertInto('rating_destination')
                            .values({
                                score: getRandomArbitrary(4, 6),
                                destination_id: e.id,
                                user_id: users[user],
                            })
                            .execute();
                    })
                );
                // await db.insertInto();
                return;
            }),
        ]);

        const destinations = await db
            .selectFrom('destination')
            .where(
                'id',
                'not in',
                topDestinations.map((destination) => destination.id)
            )
            .selectAll()
            .execute();

        await Promise.all([
            destinations.map(async (e) => {
                const randomLength = getRandomArbitrary(0, users.length / 2);
                await Promise.all(
                    users.slice(0, randomLength).map(async (user) => {
                        await db
                            .insertInto('rating_destination')
                            .values({
                                score: getRandomArbitrary(3, 6),
                                destination_id: e.id,
                                user_id: users[user],
                            })
                            .execute();
                    })
                );
            }),
        ]);
    } catch (e) {
        console.log(e);
    }
}
