import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_WEB_SECRET,
    'postmessage'
);

export async function verify(code) {
    const payload = (
        await axios.get(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${code}`
        )
    ).data;
    const userId = payload['sub'];
    const email = payload.email;

    return { userId, email, email_verified: payload.email_verified };
}
