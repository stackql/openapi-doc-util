const fs = require('fs');
const yaml = require('js-yaml');
import { parse } from './parse.js';
import { showUsage } from './usage.js';
import { 
    log,
    printOptions,
    createDestDir,
} from './shared-functions.js';

export async function providerBuild(options) {

    if (!options.apiDocOrDir || !options.providerName || !options.providerVersion){
        showUsage('provider-build');
        return            
    }

    const apiDocDirRoot = options.apiDocOrDir;
    const providerName = options.providerName;
    const providerVersion = options.providerVersion;
    const overwrite = options.overwrite;
    const destDir = `${options.outputDir}/${providerName}/${providerVersion}`;
    const inputDir = `${apiDocDirRoot}/${providerName}/${providerVersion}`;

    if(options.debug){
        printOptions(options);
    } else {
        log('info', `generating StackQL provider docs for dev docs in ${inputDir}`);
    }    

    // check if dest dir exists and create
    if(!createDestDir(`${destDir}/services`, overwrite)){
        return false
    }

    // check for provider.yaml doc
    if (!fs.existsSync(`${inputDir}/provider.yaml`)) {
        log('error', `${inputDir}/provider.yaml does not exist`);
        return false
    }

    // check for services dir
    if (!fs.existsSync(`${inputDir}/services`)){
        log('error', `${inputDir}/services does not exist`);
        return false
    };

    // write out provider.yaml to target
    try {
        log('info', `writing out ${inputDir}/provider.yaml`);
        fs.writeFileSync(`${destDir}/provider.yaml`, fs.readFileSync(`${inputDir}/provider.yaml`, 'utf8'));
    } catch (e) {
        log('error', `failed to write ${destDir}/provider.yaml`);
    }
    
    // iterate through services dir
    const services = fs.readdirSync(`${inputDir}/services`);
    for (const service of services) {

        log('info', `processing ${service}...`);

        let outputData = {};

        // get openapi doc
        let openapiDocFile = `${inputDir}/services/${service}/${service}.yaml`;
        if (!fs.existsSync(openapiDocFile)){
            log('error', `${openapiDocFile} does not exist`);            
            return false
        };

        // parse openapi doc
        let api = await parse(openapiDocFile);
        if (!api){
            return false;
        }

        // add openapi data from service doc to outputData
        Object.keys(api).forEach(openapiKey => {
            outputData[openapiKey] = api[openapiKey];
        });

        // get stackql resource definitions
        log('info', `processing resource definitions for ${service}...`);
        let resourceDefs = yaml.load(fs.readFileSync(`${inputDir}/services/${service}/${service}-resources.yaml`, 'utf8'));
        
        // iterate through resources remove dev keys
        let xStackQLResources = resourceDefs['components']['x-stackQL-resources'];

        try {
            Object.keys(xStackQLResources).forEach(xStackQLResKey => {
                // clean up pointers
                Object.keys(xStackQLResources[xStackQLResKey]['methods']).forEach(methodName => {
                    let newOp = xStackQLResources[xStackQLResKey]['methods'][methodName]['operation']['$ref'].split('#/').pop();
                    xStackQLResources[xStackQLResKey]['methods'][methodName]['operation'] =
                    {
                        '$ref': `#/${newOp}`
                    };
                });
                let newSqlVerbs = {};
                Object.keys(xStackQLResources[xStackQLResKey]['sqlVerbs']).forEach(sqlVerb => {
                    let newSqlVerb = [];
                    let tokens = [];
                    xStackQLResources[xStackQLResKey]['sqlVerbs'][sqlVerb].forEach(sqlVerbObj => {
                        if (sqlVerbObj['enabled'] === true){
                            tokens.push(sqlVerbObj['tokens']);
                            var thisRef = {};
                            thisRef['$ref'] = sqlVerbObj['$ref'];
                            newSqlVerb.push(thisRef);
                        };
                    });
                    // check if tokens are unique
                    if (tokens.length !== new Set(tokens).size){
                        log('error', `unreachable routes in ${service}/${xStackQLResKey}`);
                        throw 'Break';
                    };
                    newSqlVerbs[sqlVerb] = newSqlVerb;
                });
                xStackQLResources[xStackQLResKey]['sqlVerbs'] = newSqlVerbs;
            });
            
            outputData['components']['x-stackQL-resources'] = xStackQLResources
            const outputFile = `${destDir}/services/${service}.yaml`;
            log('info', `writing service doc to ${outputFile}...`);
            fs.writeFileSync(outputFile, yaml.dump(outputData, {lineWidth: -1}));
    

        } catch (e) {
            return false
        }            
    }
}
  