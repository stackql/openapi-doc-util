const jp = require('jsonpath');

import { 
    log,
    camelToSnake,
    capitalizeFirstLetter,
    getMeaningfulPathTokens,
    getAllPathTokens,
 } 
from './shared-functions.js';
import { 
    getSqlVerbForGoogleProvider,
} from './provider-custom-functions.js';
import { getAzureOpObjectKey } from './providers/azure.js';

function getResourceName(providerName, operation, service, resDiscriminator, pathKey){
    if(resDiscriminator == 'path_tokens'){
        let resTokens = [];
        let pathTokens = getMeaningfulPathTokens(pathKey);
        for (let i in pathTokens) {
            if (pathTokens[i] != service && pathTokens[i].length > 0){
                resTokens.push(camelToSnake(pathTokens[i]));
            }
        }
        return resTokens.length > 0 ? resTokens.join('_') : service;
    } else {
        let resValue = jp.query(operation, resDiscriminator)[0];
        // temp res name fix for azure to be superceded by an update to https://github.com/stackql/stackql-azure-openapi
        if (providerName == 'azure' && service == 'network' && resValue == 'p2_s_vpn_gateways'){
            resValue = 'p2s_vpn_gateways';
        }
        return resValue ? camelToSnake(resValue) : service;
    }
}

function getOperationId(apiPaths, pathKey, verbKey, existingOpIds, methodKey, service, resource){
    let operationId = apiPaths[pathKey][verbKey][methodKey];
    if (operationId){
        if (operationId.includes('/')){
            operationId = operationId.split('/')[1]
        } 
        operationId = operationId.replace(/-/g, '_').replace(/\./g, '_');
        // remove service prefix
        if (operationId.startsWith(service + '_')){
            operationId = operationId.replace(service + '_', '');
        }
        // remove resource prefix
        if (operationId.startsWith(resource + '_')){
            operationId = operationId.replace(resource + '_', '');
        }        
        // check for uniqueness
        if (existingOpIds.includes(operationId)){
            // preserve op type
            if (operationId.endsWith('_list')){
                operationId = 'list_' + operationId.substring(0, operationId.length - 5);
            }
            if (operationId.endsWith('_create')){
                operationId = 'create_' + operationId.substring(0, operationId.length - 7);
            }
            if (operationId.endsWith('_delete')){
                operationId = 'delete_' + operationId.substring(0, operationId.length - 7);
            }
            // get path params
            let pathParams = (pathKey.match(/\{[\w]*\}/g) || ['by_noparams']);
            let opSuffixes = []
            for (let ix in pathParams){
                opSuffixes.push('by_' + pathParams[ix].replace(/\{|\}/g, ''));
            }
            operationId = operationId + '_' + opSuffixes.join('_');
        }
        return operationId;
    } else {
        log('info', `no method key found for ${pathKey}/${verbKey}, using path tokens and verb`);
        return verbKey + '_' + getAllPathTokens(pathKey).join('_');
    }
}

function getOperationRef(service, pathKey, verbKey){
    return `${service}.yaml#/paths/${pathKey.replace(/\//g,'~1')}/${verbKey}`;
}

function getResponseCode(responses){
    let respcode = '200';
    if (responses){
        Object.keys(responses).forEach(respKey => {
            if (respKey.startsWith('2')){
                respcode = respKey;
            };
        });
    }
    return respcode;
}

function getSqlVerb(op, operationId, verbKey, providerName){
    if(providerName == 'google'){
        return getSqlVerbForGoogleProvider(operationId, verbKey);
    } else if (providerName == 'azure' || providerName == 'azure_extras'){
        return op['x-stackQL-verb'];
    } else {
        let verb = 'exec';
        if (operationId.includes('recreate') || operationId.startsWith('undelete') || verbKey == 'patch' || verbKey == 'put'){
            verb = 'exec';
        } else if (verbKey == 'delete') {
            if (operationId.includes('delete') || operationId.startsWith('remove')){
                verb = 'delete';
            }
        } else if (verbKey == 'post'){
            if (operationId.includes('create') || operationId.startsWith('insert') || operationId.startsWith('add') || operationId.startsWith('post')){
                verb = 'insert';
            }
        } else if (operationId.includes('get') || operationId.startsWith('list') || operationId.startsWith('select') || operationId.startsWith('read') || operationId.endsWith('list')){
            verb = 'select';
        };
        return verb;
    }
}

function initProviderData(providerName, providerVersion){
    let providerData = {};
    providerData.id = providerName;
    providerData.name = providerName;
    providerData.version = providerVersion;
    providerData.providerServices = {};
    return providerData;
}

function initResData(){
    let resData = {};
    resData['components'] = {};
    resData['components']['x-stackQL-resources'] = {};
    return resData;
}

function addResource(resData, providerName, service, resource){
    log('info', `initializing ${resource}`);
    resData['components']['x-stackQL-resources'][resource] = {};
    resData['components']['x-stackQL-resources'][resource]['id'] = `${providerName}.${service}.${resource}`;
    resData['components']['x-stackQL-resources'][resource]['name'] = `${resource}`;
    resData['components']['x-stackQL-resources'][resource]['title'] = `${capitalizeFirstLetter(resource)}`;
    resData['components']['x-stackQL-resources'][resource]['methods'] = {};
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs'] = {};
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['select'] = [];
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['insert'] = [];
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['update'] = [];
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['delete'] = [];
    return resData;
}

function addOperation(resData, serviceDirName, resource, operationId, api, pathKey, verbKey, providerName){
    let apiPaths = api.paths;
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId] = {};
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['operation'] = {};
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['response'] = {};
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['operation']['$ref'] = 
        getOperationRef(serviceDirName, pathKey, verbKey);
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['response']['mediaType'] = 'application/json';
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['response']['openAPIDocKey'] =
        getResponseCode(apiPaths[pathKey][verbKey]['responses']);

    // get resp item
    if(providerName == 'azure' || providerName == 'azure_extras'){
        if (getAzureOpObjectKey(serviceDirName, resource, verbKey) != 'none'){
            resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['response']['objectKey'] = getAzureOpObjectKey(serviceDirName, resource, verbKey);
        }
    }

    if(providerName == 'google'){
        if(apiPaths[pathKey][verbKey]['responses'] && apiPaths[pathKey][verbKey]['responses']['200']){
            let schemaRef = apiPaths[pathKey][verbKey]['responses']['200']['content']['application/json']['schema']['$ref'].split('/').slice(-1);
            if(schemaRef[0].match(/^List/)){
                let schema = api.components.schemas[schemaRef];
                if(schema['properties']){
                    let realprops = [];
                    for(let prop in schema['properties']){
                        if(schema['properties'][prop]['type'] && schema['properties'][prop]['type'] == 'array' && schema['properties'][prop]['items']){
                            realprops.push(prop);
                        }
                    }
                    if(realprops.length == 1){
                        resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['response']['objectKey'] = realprops[0];
                    }
                }
            }
        }
    }
    return resData;
}

function getRespSchemaName(op){
    for(let respCode in op.responses){
        if(respCode.startsWith('2')){
            return getAllValuesForKey(op.responses[respCode], "$ref", ['examples', 'description', 'headers']);
        }
    }
}

function getAllValuesForKey(obj, key, excludeKeys=[], refs=[]) {
    for (let k in obj) {
        if (typeof obj[k] === "object") {
            if(!excludeKeys.includes(k)){
                getAllValuesForKey(obj[k], key, excludeKeys, refs)
            }
        } else {
            if (k === key){
                refs.push(obj[k].split('/').pop());
            }
        }
    }
    return refs;
}

function addSqlVerb(op, resData, operationId, resource, pathKey, verbKey, providerName){
    switch (getSqlVerb(op,operationId, verbKey, providerName)) {
        case 'select':
            resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['select'].push(
                {
                    '$ref': `#/components/x-stackQL-resources/${resource}/methods/${operationId}`,
                    'path': pathKey,
                    'numTokens': (pathKey.match(/\{[\w]*\}/g) || []).length,   
                    'tokens': (pathKey.match(/\{[\w]*\}/g) || []).join(','),
                    'enabled': true,
                    'respSchema': getRespSchemaName(op), 
                });
            break;
        case 'insert':
            resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['insert'].push(
                {
                    '$ref': `#/components/x-stackQL-resources/${resource}/methods/${operationId}`,
                    'path': pathKey,
                    'numTokens': (pathKey.match(/\{[\w]*\}/g) || []).length,   
                    'tokens': (pathKey.match(/\{[\w]*\}/g) || []).join(','),
                    'enabled': true                                        
                });
            break;
        case 'delete':
            resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['delete'].push(
                {
                    '$ref': `#/components/x-stackQL-resources/${resource}/methods/${operationId}`,
                    'path': pathKey,
                    'numTokens': (pathKey.match(/\{[\w]*\}/g) || []).length,   
                    'tokens': (pathKey.match(/\{[\w]*\}/g) || []).join(','),
                    'enabled': true
                });
            break;
        default:
            break;
    };
    return resData;
}

function compareSqlVerbObjects( a, b ) {
    let aCount = (a.path.match(/\{[\w]*\}/g) || []).length;
    let bCount = (b.path.match(/\{[\w]*\}/g) || []).length;
    if (aCount > bCount) {
        return -1;
    }
    if (aCount > bCount) {
        return 1;
    }
    return 0;
}

function updateProviderData(
    providerData, 
    providerName,
    providerVersion,
    serviceDirName, 
    serviceVersion, 
    service, 
    providerTitle, 
    providerDescription, 
    openapi, 
    serviceTitle, 
    serviceDescription){
        providerData.providerServices[service] = {};
        providerData.providerServices[service].description = serviceDescription;
        providerData.providerServices[service].id = `${service}:${serviceVersion}`;
        providerData.providerServices[service].name = service;
        providerData.providerServices[service].preferred = true;
        providerData.providerServices[service].service = {};
        providerData.providerServices[service].service['$ref'] = `${providerName}/${providerVersion}/services/${serviceDirName}.yaml`;
        providerData.providerServices[service].title = serviceTitle;
        providerData.providerServices[service].version = serviceVersion;
        providerData.openapi = openapi;
        providerData.description = providerDescription;
        providerData.title = providerTitle;
        return providerData;
}
 
export {
    getResourceName,
    getOperationId,
    initProviderData,
    initResData,
    addResource,
    addOperation,
    addSqlVerb,
    updateProviderData,
    compareSqlVerbObjects,
  }