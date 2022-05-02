function getCustomServiceNameAndDesc(serviceName, providerName, pathKey, tags){
    switch(providerName) {
        case 'github':
            let name = getGitHubServiceName(serviceName, pathKey);
            let desc = getGitHubServiceDesc(serviceName, tags);
            return [name, desc]; 
        default:
            return [serviceName, serviceName];
    };
}

//
// custom provider functions
//

function getGitHubServiceName(serviceName, pathKey){
    if (serviceName === 'enterprise_admin'){
        return serviceName;
    } else {
        switch(pathKey.split('/')[1]) {
            case 'repositories':
                if(serviceName === 'repos'){
                    return `repos`;
                } else {
                    return `${serviceName}_repos`;
                }
            case 'repos':
                if(serviceName === 'repos'){
                    return `repos`;
                } else {
                    return `${serviceName}_repos`;
                }
            case 'enterprises':
                return `${serviceName}_enterprises`;
            case 'orgs':
                if(serviceName === 'orgs'){
                    return `orgs`;
                } else {
                    return `${serviceName}_orgs`;
                }
            default:
                return serviceName;
          };
    }
}

function getGitHubServiceDesc(serviceName, tags){
    for(let idx in tags){
        if(tags[idx]['name'] === serviceName){
            return tags[idx]['description'];
        }
    }
    return serviceName;
}

export { 
    getCustomServiceNameAndDesc,
};