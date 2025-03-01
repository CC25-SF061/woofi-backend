import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

export async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userId = payload['sub'];
    const email = payload.email;

    return { userId, email, email_verified: payload.email_verified };
}
