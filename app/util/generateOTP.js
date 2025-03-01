import { randomInt } from "./safeRandom.js";

/**
 * @returns {number}
 */
export  function generateOTP(){
    return randomInt(100000,999999);
}