/*
 *  openapi-doc-util provider-dev <apiDocDir> <flags> 
 *  
 *  Discovers StackQL resourecs from a directory
 *  containing OpenAPI specs. 
 * 
 */

const fs = require('fs');
import { parse } from './parse.js';
import { 
    log,
    printOptions,
} from './shared-functions.js';
import { 
    getResourceName,
    getOperationId,
    initProviderData,
    initResData,
    addResource,
    addOperation,
    addSqlVerb,
    updateProviderData,
    compareSqlVerbObjects,
} from './resource-functions.js';
import {
    operations,
} from './service-functions.js';
import { showUsage } from './usage.js';
const yaml = require('js-yaml');

export async function providerDev(options) {

    if (!options.apiDocOrDir || !options.resDiscriminator || !options.providerName || !options.providerVersion || !options.methodKey){
        showUsage('provider-dev');
        return
    }

    const apiDocDirRoot = options.apiDocOrDir;
    const resDiscriminator = options.resDiscriminator;
    const methodKey = options.methodKey;
    const providerName = options.providerName;
    const providerVersion = options.providerVersion;
    const overwrite = options.overwrite;

    const providerDocDir = `${apiDocDirRoot}/${providerName}/${providerVersion}`;
    const svcDir = `${providerDocDir}/services`;

    if(options.debug){
        printOptions(options);
    } else {
        log('info', `generating StackQL resource definitions for services in ${svcDir}`);
    }

    const providerDoc = `${providerDocDir}/provider.yaml`;
    
    // init provider doc
    let providerData = initProviderData(providerName, providerVersion);

    // iterate through services
    const serviceDirs = fs.readdirSync(svcDir)
    for (let service of serviceDirs){
        const serviceDirName = service;
        log('info', `processing ${service}`);

        const svcDoc = `${svcDir}/${service}/${service}.yaml`;
        const resDoc = `${svcDir}/${service}/${service}-resources.yaml`;

        let resData = initResData();

        // get service version if it exists
        let serviceVersion = service.match(/^[\w]*-(v[0-9]*.*)/);
        if (serviceVersion){
            serviceVersion = serviceVersion[1];
            service = service.replace('-' + serviceVersion, '');
        } else {
            serviceVersion = providerVersion;
        }

        // read service doc
        let api = await parse(svcDoc);
        if (!api){
            return false;
        }

        // iterate through operations in service doc
        Object.keys(api.paths).forEach(pathKey => {
            log('debug', `processing path [${pathKey}]`, options.debug);
            Object.keys(api.paths[pathKey]).forEach(verbKey => {
                log('debug', `processing operation [${pathKey}:${verbKey}]`);

                if (operations.includes(verbKey)){
                    try {
                        // get resource name
                        let resource = getResourceName(providerName, api.paths[pathKey][verbKey], service, resDiscriminator, pathKey);
                        log('debug', `resource : [${resource}]`, options.debug);
    
                        if (!resData['components']['x-stackQL-resources'].hasOwnProperty(resource)){
                            // fisrt occurance of the resource, init resource
                            resData = addResource(resData, providerName, service, resource);
                        }
                        
                        const existingOpIds = Object.keys(resData['components']['x-stackQL-resources'][resource]['methods']);

                        // get unique operation id 
                        let operationId = getOperationId(api.paths, pathKey, verbKey, existingOpIds, methodKey);
                      
                        if(operationId){
                            log('info', `operationId : [${operationId}]`);
                        } else {
                            throw 'Break';
                        }
                        
                        // add operation to resource
                        resData = addOperation(resData, serviceDirName, resource, operationId, api.paths, pathKey, verbKey);
    
                        // map sqlVerbs for operation
                        resData = addSqlVerb(api.paths[pathKey][verbKey], resData, operationId, resource, pathKey);
    
                    } catch (e) {
                        if (e !== 'Break') throw e
                    }
                }

            });
        });
     
        // order sqlVerbs
        Object.keys(resData['components']['x-stackQL-resources']).forEach(res => {
            resData['components']['x-stackQL-resources'][res]['sqlVerbs']['select'].sort( compareSqlVerbObjects );
            resData['components']['x-stackQL-resources'][res]['sqlVerbs']['insert'].sort( compareSqlVerbObjects );
            resData['components']['x-stackQL-resources'][res]['sqlVerbs']['update'].sort( compareSqlVerbObjects );
            resData['components']['x-stackQL-resources'][res]['sqlVerbs']['delete'].sort( compareSqlVerbObjects );
        });

        // write out resources doc
        if (fs.existsSync(resDoc) && !options.overwrite){
            log('error', `${resDoc} exists and overwrite is false`);
            return false;
        } else {
            fs.writeFileSync(resDoc, yaml.dump(resData, {lineWidth: -1}));
            log('info', `${resDoc} written`);
        }

        // update provider doc
        providerData = updateProviderData(
            providerData, 
            providerName,
            providerVersion,
            serviceDirName, 
            serviceVersion, 
            service, 
            api.title, 
            api.description, 
            api.openapi, 
            api.info.title, 
            api.info.description);

    }

    // write out provider doc
    if (fs.existsSync(providerDoc) && !overwrite){
        log('error', `${providerDoc} exists and overwrite is false`);
        return false;
    } else {
        fs.writeFileSync(providerDoc, yaml.dump(providerData, {lineWidth: -1}));
        log('info', `${providerDoc} written`);
    }

}