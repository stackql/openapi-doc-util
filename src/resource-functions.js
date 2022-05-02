const jp = require('jsonpath');
import { log } from './shared-functions.js';

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
    resData['components']['x-stackQL-resources'][resource]['title'] = `${resource}`;
    resData['components']['x-stackQL-resources'][resource]['methods'] = {};
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs'] = {};
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['select'] = [];
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['insert'] = [];
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['update'] = [];
    resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['delete'] = [];
    return resData;
}

function addOperation(resData, service, resource, operationId, apiPaths, pathKey, verbKey){
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId] = {};
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['operation'] = {};
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['response'] = {};
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['operation']['$ref'] = 
        getOperationRef(service, pathKey, verbKey);
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['response']['mediaType'] = 'application/json';
    resData['components']['x-stackQL-resources'][resource]['methods'][operationId]['response']['openAPIDocKey'] =
        getResponseCode(apiPaths[pathKey][verbKey]['responses']);
    return resData;
}

function addSqlVerb(resData, operationId, resource, pathKey){
    switch (getSqlVerb(operationId)) {
        case 'select':
            resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['select'].push(
                {
                    '$ref': `#/components/x-stackQL-resources/${resource}/methods/${operationId}`,
                    'path': pathKey,
                    'tokens': (pathKey.match(/\{[\w]*\}/g) || []).join(','),
                    'enabled': true
                });
            break;
        case 'insert':
            resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['insert'].push(
                {
                    '$ref': `#/components/x-stackQL-resources/${resource}/methods/${operationId}`,
                    'path': pathKey,
                    'tokens': (pathKey.match(/\{[\w]*\}/g) || []).join(','),
                    'enabled': true                                        
                });
            break;
        case 'delete':
            resData['components']['x-stackQL-resources'][resource]['sqlVerbs']['delete'].push(
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
    return resData;
}

function updateProviderData(
    providerData, 
    providerName, 
    providerVersion, 
    service, 
    providerTitle, 
    providerDescription, 
    openapi, 
    serviceTitle, 
    serviceDescription){
        providerData.providerServices[service] = {};
        providerData.providerServices[service].description = serviceDescription;
        providerData.providerServices[service].id = `${service}:${providerVersion}`;
        providerData.providerServices[service].name = service;
        providerData.providerServices[service].preferred = true;
        providerData.providerServices[service].service = {};
        providerData.providerServices[service].service['$ref'] = `${providerName}/${providerVersion}/services/${service}.yaml`;
        providerData.providerServices[service].title = serviceTitle;
        providerData.providerServices[service].version = providerVersion;
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
  }