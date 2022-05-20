import { showUsage, parseArgumentsIntoOptions } from './usage.js';
import { split } from './split.js';
import { validate } from './validate.js';
import { providerDev } from './provider-dev.js';
import { providerBuild } from './provider-build.js';
//import { serviceDocs } from './service-docs.js';

export async function cli(args) {

    const options = parseArgumentsIntoOptions(args);
    const operation = options.operation || false;

    if (!operation){
        showUsage('unknown');
        return
    } else {
        switch(operation) {
            case 'validate':
                await validate(options);
                break;
            case 'split':
                await split(options);
                break;
            case 'provider-dev':
                await providerDev(options);
                break;
            case 'provider-build':
                await providerBuild(options);
                break; 
//            case 'service-docs':
//                await serviceDocs(options);
//                break;                                
            default:
                showUsage('unknown');
                break;
        };
    };
}