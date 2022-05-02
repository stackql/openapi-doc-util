import { log } from './shared-functions.js';
const OpenAPIParser = require("@readme/openapi-parser");

export async function parse(apiDoc) {
    let api = false;
    try {
        log('info', `parsing ${apiDoc}...`);
        api = await OpenAPIParser.parse(apiDoc, {resolve: {http: false}});
        log('info', `${apiDoc} parsed successfully`);
    } catch (err) {
        log('error', err);
    }
    return api;
}