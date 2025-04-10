import Boom from '@hapi/boom';
import { getProvince } from '../../core/GeoLocation.js';

export class GeoLocationController {
    constructor() {}

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    async getLocation(request, h) {
        try {
            const location = getProvince();
            return h.response({
                success: true,
                message: 'success retrieve province',
                data: location,
            });
        } catch (e) {
            console.log(e);
            return Boom.internal();
        }
    }
}
