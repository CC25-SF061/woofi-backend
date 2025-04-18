import 'dotenv/config';
import './core/PgType.js';
import hapi from '@hapi/hapi';
import jwt from '@hapi/jwt';
import vision from '@hapi/vision';
import auth from './app/routes/user-auth.js';
import inert from '@hapi/inert';
import hapiswagger from 'hapi-swagger';
import cookieConfig, { COOKIE_DATA_NAME } from './config/cookie.js';
import geolocation from './app/routes/geolocation.js';
import contact from './app/routes/contact.js';
import destination from './app/routes/destination.js';
import wishlist from './app/routes/wishlist.js';
import profile from './app/routes/profile.js';
import admin from './app/routes/admin.js';
import user from './app/routes/user.js';

const server = hapi.server({
    host: '0.0.0.0',
    port: 8070,
    routes: {
        cors: {
            credentials: true,
            origin: process.env.ALLOWED_ORIGIN
                ? process.env.ALLOWED_ORIGIN.split(',')
                : ['*'],
            // headers: ['*'],
            // exposedHeaders: ['set-cookie'],
        },
    },
});
await server.register([
    jwt,
    inert,
    vision,
    {
        plugin: hapiswagger,
        options: {
            grouping: 'tags',
            info: {
                title: 'Api Documentation',
                version: '0.0.1',
            },
        },
    },
]);
server.auth.strategy('accessToken', 'jwt', {
    keys: process.env.ACCESS_TOKEN_SECRET,
    headerName: 'authorization',
    verify: {
        iss: process.env.APP_URL,
        sub: false,
        aud: false,
        nbf: true,
        exp: true,
    },
    /**
     * @param {object} artifact
     * @param {import('@hapi/hapi').Request} request
     * @param {import('@hapi/hapi').ResponseToolkit} h
     */
    validate: (artifact, request, h) => {
        return {
            isValid: true,
            credentials: { ...artifact.decoded.payload },
        };
    },
});

server.state(COOKIE_DATA_NAME, cookieConfig);
server.keepAliveTimeout = 60 * 1000 + 1000;
server.headersTimeout = 60 * 1000 + 2000;
server.route(
    [].concat(
        auth,
        geolocation,
        contact,
        destination,
        wishlist,
        profile,
        admin,
        user,
        [
            {
                method: ['get'],
                path: '/',
                handler: () => {
                    return 'Hello world!';
                },
            },
        ]
    )
);

await server.start((err) => {
    if (err) {
        console.log(err);
    }
});

export default server;
