function getCustomServiceNameAndDesc(serviceName, providerName, pathKey, tags){
    let name = 'service_name';
    let desc = 'service_desc';
    switch(providerName) {
        case 'github':
            name = getGitHubServiceName(serviceName, pathKey);
            desc = getGitHubServiceDesc(serviceName, tags);
            return [name, desc]; 
        case 'netlify':
            return getNetlifyServiceNameAndDesc(serviceName, tags);
        default:
            return [serviceName, serviceName];
    };
}

function getCustomResourceName(resource, providerName, pathKey){
    switch(providerName) {
        default:
            return resource;
    };
}

//
// custom provider functions
//

// GitHub

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


// Netlify

const netlifyServiceTagMap = 
{
    ticket: {
        name: 'oauth',
        desc: 'OAuth',
    }, 
    accessToken: {
        name: 'oauth',
        desc: 'OAuth',
    },
    user: {
        name: 'user_accounts',
        desc: 'User Accounts',
    },
    accountMembership: {
        name: 'user_accounts',
        desc: 'User Accounts',
    },
    member:  {
        name: 'user_accounts',
        desc: 'User Accounts',
    },
    accountType:  {
        name: 'user_accounts',
        desc: 'User Accounts',
    },
    paymentMethod:  {
        name: 'user_accounts',
        desc: 'User Accounts',
    },
    auditLog:  {
        name: 'user_accounts',
        desc: 'User Accounts',
    },
    site: {
        name: 'site',
        desc: 'Site',
    },
    file: {
        name: 'site',
        desc: 'Site',
    },
    metadata: {
        name: 'site',
        desc: 'Site',
    },
    snippet: {
        name: 'site',
        desc: 'Site',
    },
    dnsZone: {
        name: 'domain_names',
        desc: 'Domain Names',
    },
    sniCertificate: {
        name: 'domain_names',
        desc: 'Domain Names',
    },
    deploy: {
        name: 'deploys',
        desc: 'Deploys',
    },
    deployedBranch: {
        name: 'deploys',
        desc: 'Deploys',
    },
    deployKey: {
        name: 'deploys',
        desc: 'Deploys',
    },
    build: {
        name: 'builds',
        desc: 'Builds',
    },
    buildLogMsg: {
        name: 'builds',
        desc: 'Builds',
    },
    hook: {
        name: 'notifications',
        desc: 'Webhooks and Notifications',
    },
    hookType: {
        name: 'notifications',
        desc: 'Webhooks and Notifications',
    },
    buildHook: {
        name: 'notifications',
        desc: 'Webhooks and Notifications',
    },
    service: {
        name: 'services',
        desc: 'Services',
    },
    serviceInstance: {
        name: 'services',
        desc: 'Services',
    },
    function: {
        name: 'functions',
        desc: 'Functions',
    },
    form: {
        name: 'forms',
        desc: 'Forms',
    },
    submission: {
        name: 'forms',
        desc: 'Forms',
    },
    splitTest: {
        name: 'split_tests',
        desc: 'Split Tests',
    },
    asset: {
        name: 'large_media',
        desc: 'Large Media',
    },
    assetPublicSignature: {
        name: 'large_media',
        desc: 'Large Media',
    },
};

function getNetlifyServiceNameAndDesc(serviceName, tags){
    if(netlifyServiceTagMap[serviceName]){
        return [
            netlifyServiceTagMap[serviceName]['name'],
            netlifyServiceTagMap[serviceName]['desc'],
        ];
    } else {
        return [serviceName, serviceName];
    };
}

export { 
    getCustomServiceNameAndDesc,
    getCustomResourceName,
};