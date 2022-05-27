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

export { 
    getCustomServiceNameAndDesc,
    getCustomResourceName,
};