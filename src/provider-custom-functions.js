import { 
    camelToSnake,
} from './shared-functions.js';
import {
    getGitHubServiceName,
    getGitHubServiceDesc,
} from './providers/github.js';
import {
    getJiraServiceName,
    getJiraServiceDesc,
} from './providers/jira.js';

function getCustomServiceNameAndDesc(serviceName, providerName, pathKey, tags){
    let name = 'service_name';
    let desc = 'service_desc';
    switch(providerName) {
        case 'github':
        //    name = getGitHubServiceName(serviceName, pathKey);
            desc = getGitHubServiceDesc(serviceName, tags);
            return [camelToSnake(serviceName), desc];
        case 'jira':
            name = getJiraServiceName(serviceName);
            //desc = getJiraServiceDesc(serviceName, tags);
            return [name, name];             
        default:
            return [camelToSnake(serviceName), serviceName];
    };
}

function getCustomResourceName(resource, providerName, pathKey){
    switch(providerName) {
        default:
            return resource;
    };
}

function getSqlVerbForGoogleProvider(operationId, verbKey){
    let verb = 'exec';
    let action = operationId.split('_').slice(-1)[0];
    let resource = operationId.split('_').slice(-2)[0];
    if (
        action.startsWith('add') && 
        action !== 'addons'
        ){
        verb = 'insert';
    } else if (
        action.startsWith('create') ||
        action.startsWith('insert') ||
        action === 'batchCreate' ||
        action === 'bulkInsert'
    ){
        verb = 'insert';
    } else if (
        action.startsWith('get') ||
        action.startsWith('list') ||
        action.startsWith('aggregated') ||
        action.startsWith('batchGet') ||
        action.startsWith('fetch') ||
        // action.startsWith('query') ||
        action.startsWith('read') ||
        action.startsWith('retrieve')
        // || action.startsWith('search')
    ){
        verb = 'select';
        // aggregated scoped list 
        if((resource == 'healthChecks' || 
            resource == 'backendServices' || 
            resource == 'globalOperations' || 
            resource == 'securityPolicies' ||
            resource == 'sslCertificates' ||
            resource == 'targetHttpProxies' ||
            resource == 'targetHttpsProxies' ||
            resource == 'urlMaps'
        ) && action == 'aggregatedList'){
            verb = 'exec';
        }
        // exceptions
        if(resource == 'relyingparty' && action == 'getPublicKeys'){
            verb = 'exec';
        }
    } else if (
        action.startsWith('delete') ||
        action.startsWith('remove') ||
        action === 'batchDelete' ||
        action === 'destroy' ||
        action === 'dropDatabase'
    ){
        if(action != 'removeProject'){
            verb = 'delete';    
        }
    }
    return verb;
}

export { 
    getCustomServiceNameAndDesc,
    getCustomResourceName,
    getSqlVerbForGoogleProvider,
};