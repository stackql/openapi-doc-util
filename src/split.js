/*
 *  openapi-doc-util split <apiDoc> <flags> 
 *  
 *  Splits an OpenAPI spec into smaller, self contained, 
 *  service scoped documents using a JSONPath expression 
 *  relative to each operation. 
 * 
 */

import { parse } from './parse.js';
import { 
    log,
    printOptions,
    createDestDir,
 } from './shared-functions.js';
import {
    componentsChildren,
    getAllRefs,
    addRefsToComponents,
    retServiceNameAndDesc,
    initService,
    operations,
    nonOperations,
} from './service-functions.js';
import { showUsage } from './usage.js';

const yaml = require('js-yaml');
const fs = require('fs');

export async function split(options) {
    
    if (!options.apiDocOrDir || !options.svcDiscriminator || !options.providerName || !options.providerVersion){
        showUsage('split');
        return
    }

    const apiDoc = options.apiDocOrDir;
    const svcDiscriminator = options.svcDiscriminator;
    const outputDir = options.outputDir;
    const providerName = options.providerName;
    const providerVersion = options.providerVersion;
    const overwrite = options.overwrite;

    if(options.debug){
        printOptions(options);
    } else {
        log('info', `performing split operation on ${apiDoc}, outputting to ${outputDir}`);
    }

    // check if dest dir exists
    const destDir = `${outputDir}/${providerName}/${providerVersion}`;

    if(!createDestDir(destDir, overwrite)){
        return false
    }

    // parse api doc
    let api = await parse(apiDoc);
    if (!api){
        return false
    }
    
    const apiPaths = api.paths;

    log('info', `iterating over ${Object.keys(apiPaths).length} paths`);

    let services = {};

    // iterate over paths and verbs
    Object.keys(apiPaths).forEach(pathKey => {
        log('debug', `processing path ${pathKey}`, options.debug);
        Object.keys(apiPaths[pathKey]).forEach(verbKey => {
            log('info', `processing operation ${pathKey}:${verbKey}`);

            // if verbKey in operations, then process
            if (operations.includes(verbKey)){
                // determine service using discriminator
                let [service, serviceDesc] = retServiceNameAndDesc(providerName, apiPaths[pathKey][verbKey], pathKey, svcDiscriminator, api.tags);
                log('info', `service name : ${service}`);
                log('debug', `service desc : ${serviceDesc}`, options.debug);

                if (!services.hasOwnProperty(service)){
                    // fisrt occurance of the service, init service map
                    log('debug', `first occurance of ${service}`, options.debug);

                    services = initService(services, componentsChildren, service, serviceDesc, api);

                }

                // add operation to service
                if (!services[service]['paths'].hasOwnProperty(pathKey)){
                    log('debug', `first occurance of ${pathKey}`, options.debug);
                    services[service]['paths'][pathKey] = {};
                    services[service]['paths'][pathKey][verbKey] = apiPaths[pathKey][verbKey];
                } else {
                    services[service]['paths'][pathKey][verbKey] = apiPaths[pathKey][verbKey];
                };

                // get all refs for operation
                let opRefs = getAllRefs(apiPaths[pathKey][verbKey]);
                log('debug', `found ${opRefs.length} refs for ${service}`, options.debug);

                // add refs to components in service map
                addRefsToComponents(opRefs, services[service], api.components, options.debug)

                // get internal refs
                let intRefs = getAllRefs(services[service]['components']);
                log('debug', `found ${intRefs.length} INTERNAL refs`, options.debug);
                addRefsToComponents(intRefs, services[service], api.components, options.debug)
            }

        });
    });

    // add non operations to each service
    Object.keys(services).forEach(service => {
        Object.keys(services[service]['paths']).forEach(pathKey => {
            log('debug',`adding non operations to ${service} for path ${pathKey}`, options.debug);
            for (let nonOpIx in nonOperations){
                log('debug', `looking for non operation ${nonOperations[nonOpIx]} in ${service} under path ${pathKey}`, options.debug);
                if(apiPaths[pathKey][nonOperations[nonOpIx]]){
                    log('debug', `adding ${nonOperations[nonOpIx]} to ${service} for path ${pathKey}`, options.debug);
                    // services[service]['paths'][pathKey][nonOperations[nonOpIx]] = apiPaths[pathKey][nonOperations[nonOpIx]];
                    // interim fix
                    if(nonOperations[nonOpIx] == 'parameters'){
                        Object.keys(services[service]['paths'][pathKey]).forEach(verbKey => {
                            services[service]['paths'][pathKey][verbKey]['parameters'] = apiPaths[pathKey]['parameters'];
                        });
                    };
                }
            }
        });
    });

    // write out service docs
    Object.keys(services).forEach(service => {
        log('info', `writing out openapi doc for [${service}]`);
        let svcDir = `${outputDir}/${providerName}/${providerVersion}/services/${service}`;
        let outputFile = `${svcDir}/${service}.yaml`;
        if (!fs.existsSync(svcDir)){
            fs.mkdirSync(svcDir, { recursive: true });
        }
        fs.writeFileSync(outputFile, yaml.dump(services[service], {lineWidth: -1}));
    });
}