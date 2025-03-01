import nodemailer from 'nodemailer';
// import SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 *
 * @typedef {import('nodemailer/lib/smtp-transport').Options} SMTPOptions
 * @typedef {import('nodemailer').Transporter<SentMessageInfo,SMTPOptions>} Transporter
 */

/** @type {Transporter} */
let transporter;

/**
 * @returns {Transporter}
 * @description Lazy loading the transporter
 */
export function transport() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            pool: true,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: true,
            },
        });
    }

    return transporter;
}
