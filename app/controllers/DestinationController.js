import { getDatabase } from '../../core/Database.js';

export class DestinationController {
    /**@type {ReturnType<typeof getDatabase>} */
    db;
    constructor() {
        this.db = getDatabase();
    }

    /**
     * @param {import("@hapi/hapi").Request} request
     * @param {import("@hapi/hapi").ResponseToolkit} h
     * @return {import("@hapi/hapi").Lifecycle.ReturnValue}
     */
    addPost(request, h) {
        const { payload } = request;
        console.log(payload);
    }
}
