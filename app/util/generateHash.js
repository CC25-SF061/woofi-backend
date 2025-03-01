import { sha256 } from "js-sha256";

/**
 * @param {string} message 
 * @returns {string}
 */
export  function generateHash(message){
    return sha256.hmac(process.env.APP_KEY,message);
}