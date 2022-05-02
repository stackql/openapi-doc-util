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
import { showUsage } from './usage.js';
const jp = require('jsonpath');
const yaml = require('js-yaml');

function getResourceName(operation, service, resDiscriminator){
    let resValue = jp.query(operation, resDiscriminator)[0];
    let resource = resValue ? resValue : service;
    resource = resource.replace(/-/g, '_');
    return resource;
}

function getOperationId(apiPaths, pathKey, verbKey, methodKey){
    let methodKeyPath = apiPaths[pathKey][verbKey][methodKey];
    if (methodKeyPath){
        if (methodKeyPath.includes('/')){
            return methodKeyPath.split('/')[1].replace(/-/g, '_'); 
        } else {
            return methodKeyPath.replace(/-/g, '_'); 
        }
    } else {
        log('error', `no method key found for ${pathKey}/${verbKey}`);
        return false;
    }
}

function getOperationRef(service, pathKey, verbKey){
    return `${service}.yaml#/paths/${pathKey.replace(/\//g,'~1')}/${verbKey}`;
}

function getResponseCode(responses){
    let respcode = '200';    
    Object.keys(responses).forEach(respKey => {
        if (respKey.startsWith('2')){
            respcode = respKey;
        };
    });
    return respcode;
}

function getSqlVerb(operationId){
    let verb = 'exec';
    if (operationId.startsWith('get') || operationId.startsWith('list') || operationId.startsWith('select')){
        verb = 'select';
    } else if (operationId.startsWith('create') || operationId.startsWith('insert') || operationId.startsWith('add')){
        verb = 'insert';
    } else if (operationId.startsWith('delete') || operationId.startsWith('remove')){
        verb = 'delete';
    };
    return verb;
}

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
    let providerData = {};
    providerData.id = providerName;
    providerData.name = providerName;
    providerData.version = providerVersion;
    providerData.providerServices = {};

    // iterate through services
    const serviceDirs = fs.readdirSync(svcDir)
    for (let service of serviceDirs){
        log('info', `processing ${service}`);

        const svcDoc = `${svcDir}/${service}/${service}.yaml`;
        const resDoc = `${svcDir}/${service}/${service}-resources.yaml`;

        let resDocObj = {};
        resDocObj['components'] = {};
        resDocObj['components']['x-stackQL-resources'] = {};

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
                try {
                    // get resource name
                    let resource = getResourceName(api.paths[pathKey][verbKey], service, resDiscriminator);
                    log('debug', `resource : [${resource}]`, options.debug);

                    if (!resDocObj['components']['x-stackQL-resources'].hasOwnProperty(resource)){
                        // fisrt occurance of the resource, init resource
                        log('info', `initializing ${resource}`);
                        resDocObj['components']['x-stackQL-resources'][resource] = {};
                        resDocObj['components']['x-stackQL-resources'][resource]['id'] = `${providerName}.${service}.${resource}`;
                        resDocObj['components']['x-stackQL-resources'][resource]['name'] = `${resource}`;
                        resDocObj['components']['x-stackQL-resources'][resource]['title'] = `${resource}`;
                        resDocObj['components']['x-stackQL-resources'][resource]['methods'] = {};
                        resDocObj['components']['x-stackQL-resources'][resource]['sqlVerbs'] = {};
                        resDocObj['components']['x-stackQL-resources'][resource]['sqlVerbs']['select'] = [];
                        resDocObj['components']['x-stackQL-resources'][resource]['sqlVerbs']['insert'] = [];
                        resDocObj['components']['x-stackQL-resources'][resource]['sqlVerbs']['update'] = [];
                        resDocObj['components']['x-stackQL-resources'][resource]['sqlVerbs']['delete'] = [];
                        
                    }
                    
                    // get id 
                    let operationId = getOperationId(api.paths, pathKey, verbKey, methodKey);
                  
                    if(operationId){
                        log('info', `operationId : [${operationId}]`);
                    } else {
                        throw 'Break';
                    }
                    
                    // add operation to resource
                    resDocObj['components']['x-stackQL-resources'][resource]['methods'][operationId] = {};
                    resDocObj['components']['x-stackQL-resources'][resource]['methods'][operationId]['operation'] = {};
                    resDocObj['components']['x-stackQL-resources'][resource]['methods'][operationId]['response'] = {};
                    resDocObj['components']['x-stackQL-resources'][resource]['methods'][operationId]['operation']['$ref'] = 
                        getOperationRef(service, pathKey, verbKey);
                    resDocObj['components']['x-stackQL-resources'][resource]['methods'][operationId]['response']['mediaType'] = 'application/json';
                    resDocObj['components']['x-stackQL-resources'][resource]['methods'][operationId]['response']['openAPIDocKey'] =
                        getResponseCode(api.paths[pathKey][verbKey]['responses']);

                    // map sqlVerbs for operation
                    switch (getSqlVerb(operationId)) {
                        case 'select':
                            resDocObj['components']['x-stackQL-resources'][resource]['sqlVerbs']['select'].push(
                                {
                                    '$ref': `#/components/x-stackQL-resources/${resource}/methods/${operationId}`,
                                    'path': pathKey,
                                    'tokens': (pathKey.match(/\{[\w]*\}/g) || []).join(','),
                                    'enabled': true
                                });
                            break;
                        case 'insert':
                            resDocObj['components']['x-stackQL-resources'][resource]['sqlVerbs']['insert'].push(
                                {
                                    '$ref': `#/components/x-stackQL-resources/${resource}/methods/${operationId}`,
                                    'path': pathKey,
                                    'tokens': (pathKey.match(/\{[\w]*\}/g) || []).join(','),
                                    'enabled': true                                        
                                });
                            break;
                        case 'delete':
                            resDocObj['components']['x-stackQL-resources'][resource]['sqlVerbs']['delete'].push(
                                {
                                    '$ref': `#/components/x-stackQL-resources/${resource}/methods/${operationId}`,
                                    'path': pathKey,
                                    'tokens': (pathKey.match(/\{[\w]*\}/g) || []).join(','),
                                    'enabled': true
                                });
                            break;
                        default:
                            break;
                    };                    

                } catch (e) {
                    if (e !== 'Break') throw e
                }

            });
        });
        
        // write out resources doc
        if (fs.existsSync(resDoc) && !options.overwrite){
            log('error', `${resDoc} exists and overwrite is false`);
            return false;
        } else {
            fs.writeFileSync(resDoc, yaml.dump(resDocObj, {lineWidth: -1}));
            log('info', `${resDoc} written`);
        }

        // update provider doc
        providerData.providerServices[service] = {};
        providerData.providerServices[service].description = api.info.description;
        providerData.providerServices[service].id = `${service}:${providerVersion}`;
        providerData.providerServices[service].name = service;
        providerData.providerServices[service].preferred = true;
        providerData.providerServices[service].service = {};
        providerData.providerServices[service].service['$ref'] = `${providerName}/${providerVersion}/services/${service}.yaml`;
        providerData.providerServices[service].title = api.info.title;
        providerData.providerServices[service].version = providerVersion;
        providerData.openapi = api.openapi;
        providerData.description = api.description;
        providerData.title = api.title;

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