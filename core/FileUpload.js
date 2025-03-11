import { nanoid } from 'nanoid';
import { URL } from 'url';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
    endpoint: process.env.FILE_UPLOAD_ENDPOINT,
    region: 'auto',
    credentials: {
        accessKeyId: process.env.FILE_UPLOAD_ACCESS_KEY,
        secretAccessKey: process.env.FILE_UPLOAD_SECRET_KEY,
    },
});

/**
 * @param {string} type
 * @param {string} directory
 * @returns {string}
 */
export function createPath(type, directory) {
    if (!directory) {
        return `${nanoid}.${type}`;
    }

    return path
        .join(directory, `${nanoid()}.${type}`)
        .replaceAll(path.sep, path.posix.sep);
}

/**
 * @param {string} path
 * @returns
 */
export function getFullPath(path) {
    return new URL(path, process.env.FILE_UPLOAD_PUBLIC_DOMAIN);
}

/**
 * @param {string} name
 * @param {import('fs').ReadStream} stream
 * @returns
 */
export async function upload(name, stream, mimetype = 'image/jpeg') {
    const command = new PutObjectCommand({
        Bucket: process.env.FILE_UPLOAD_BUCKET,
        Body: stream,
        Key: name,
        ContentType: mimetype,
    });

    await client.send(command);
}
