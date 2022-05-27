function getGitHubServiceName(serviceName, pathKey){
    if (serviceName === 'enterprise_admin'){
        return serviceName;
    } else {
        switch(pathKey.split('/')[1]) {
            case 'repositories':
                if(serviceName === 'repos'){
                    return `repos`;
                } else {
                    return `repo_${serviceName}`;
                }
            case 'repos':
                if(serviceName === 'repos'){
                    return `repos`;
                } else {
                    return `repo_${serviceName}`;
                }
            case 'enterprises':
                return `enterprise_${serviceName}`;
            case 'orgs':
                if(serviceName === 'orgs'){
                    return `orgs`;
                } else {
                    return `org_${serviceName}`;
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
    getGitHubServiceName,
    getGitHubServiceDesc,
  }