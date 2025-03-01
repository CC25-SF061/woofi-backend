import crypto from 'node:crypto';

/**
 * 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function randomInt (min,max){
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 2**32;
    const range = max - min;
    return Math.floor(random * range + min);
}