const jp = require('jsonpath');
import { getCustomServiceNameAndDesc } from './provider-custom-functions.js';
import { log } from './shared-functions.js';

const componentsChildren = [
    'schemas', 
    'parameters', 
    'responses', 
    'securitySchemes', 
    'callbacks', 
    'examples', 
    'requestBodies', 
    'headers', 
    'links',
];

const operations = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
];

const nonOperations = [
    'servers',
    'parameters',
];

function getAllRefs(obj, refs=[]) {
    for (let k in obj) {
        if (typeof obj[k] === "object") {
            getAllRefs(obj[k], refs)
        } else {
            if (k === "$ref"){
                refs.push(obj[k]);
            }
        }
    }
    return refs;
}  

function addRefsToComponents(refs, service, apiComp, debug=false){
    for (let ref in refs){
        log('debug', `processing ${refs[ref]}`, debug);
        let refTokens = refs[ref].split('/');
        if (refTokens[1] === 'components'){
            let thisSection = refTokens[2];
            let thisKey = refTokens[3];
            log('debug', `adding [${thisKey}] to [components/${thisSection}]`, );
            if (componentsChildren.includes(thisSection)){
                service['components'][thisSection][thisKey] = apiComp[thisSection][thisKey];
            }
        }
    }
}

function retServiceNameAndDesc( providerName, operation, pathKey, discriminator, tags ) {
    if (discriminator.startsWith('svcName:')){
        return discriminator.split(':')[1], discriminator.split(':')[1];
    } else {
        let thisSvc = jp.query(operation, discriminator)[0] || 'svc';
        thisSvc = thisSvc.replace(/-/g, '_');
        return getCustomServiceNameAndDesc(thisSvc, providerName, pathKey, tags);
    };
}

function initService(services, componentsChildren, service, serviceDesc, api){
    services[service] = {};
    services[service]['paths'] = {};
    services[service]['components'] = {};

    for (let compChild in componentsChildren){
        services[service]['components'][componentsChildren[compChild]] = {};
    }

    services[service]['openapi'] = api.openapi || '3.0.0';
    services[service]['servers'] = api.servers;
    services[service]['security'] = api.security;
    services[service]['tags'] = api.tags;
    services[service]['externalDocs'] = api.externalDocs;

    // update info for service
    services[service]['info'] = {};
    for(let infoKey in api.info){
        if(infoKey !== 'title' || infoKey !== 'description'){
            services[service]['info'][infoKey] = api.info[infoKey];
        }
    }
    services[service]['info']['title'] = `${api.info.title} - ${service}`;
    services[service]['info']['description'] = serviceDesc;
    return services;
}

export {
    componentsChildren,
    getAllRefs,
    addRefsToComponents,
    retServiceNameAndDesc,
    initService,
    operations,
    nonOperations,
  }
  