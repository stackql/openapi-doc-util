/*
 *  openapi-doc-util validate <apiDoc>
 *  
 *  Validates an OpenAPI spec
 * 
 */

import { parse } from './parse.js';
import { log } from './shared-functions.js';
import { showUsage } from './usage.js';

export async function validate(options) {
    
    if (!options.apiDocOrDir){
        showUsage('validate');
        return
    }

    log('info', `performing ${options.operation} operation on ${options.apiDocOrDir}`);
    let api = await parse(options.apiDocOrDir);
    if (!api){
        return false;
    } else {
        return true;
    }
}