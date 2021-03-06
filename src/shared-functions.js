const jp = require('jsonpath');
const chalk = require('chalk');
const fs = require('fs');

function log(severity, message, debug=false){
    switch(severity) {
        case 'error':
            console.error(chalk.red(`ERROR: ${message}`));
            break;
        case 'warn':
            console.warn(chalk.yellow(`WARN: ${message}`));
            break;
        case 'info':
            console.info(chalk.green(`INFO: ${message}`));
            break;
        case 'debug':
            if(debug){
                console.debug(chalk.blue(`DEBUG: ${message}`));
            }
            break;
        default:
            console.log(message);
            break;
    }
}

function printOptions(options){
    Object.keys(options).forEach(option => {
        log('debug', `${option}: ${options[option]}`, true);
    });
}

function createDestDir(dir, overwrite){
    log('info', `checking if dest dir (${dir}) exists...`);
    if (fs.existsSync(dir) && !overwrite) {
        log('error', `destination Dir: ${dir} already exists`);
        return false;
    } else {
        log('info', `creating destination dir: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
        return true;
    }
}

function camelToSnake(inStr){
    let str = inStr.replace(/-/g, '_').replace(/ /g, '_');
    return str.replace(/\.?([A-Z])/g, function (x,y){
        return "_" + y.toLowerCase()
    }).replace(/^_/, "")
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function isMeaningfulToken(token, excludeParams=true){
    if(excludeParams && token.startsWith('{')){
        return false;
    } 
    if(token.match(/[v]\d/) || token.match(/^\d/) || token == 'rest' || token == 'api' || token.length == 0){
        return false;
    } else {
        return true;
    }
}

function getMeaningfulPathTokens(pathKey){
    let path = pathKey.replace(/\./g, '/').replace(/-/g, '_');    
    let outTokens = [];
    let inTokens = path.split('/');
    inTokens.forEach(token => {
        if(isMeaningfulToken(token)){
            outTokens.push(token);
        }
    });
    return outTokens;
}

function getAllPathTokens(pathKey){
    let path = pathKey.replace(/\./g, '/').replace(/-/g, '_');
    let outTokens = [];
    let inTokens = path.split('/');
    inTokens.forEach(token => {
        if(isMeaningfulToken(token, false)){
            outTokens.push(token.replace(/{/, '_').replace(/}/, ''));
        }
    });
    return outTokens;
}

function isOperationExcluded(exOption, operation, discriminator){
    if(exOption){
        if(jp.query(operation, discriminator) == exOption){
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

export { 
    log,
    printOptions,
    createDestDir,
    camelToSnake,
    capitalizeFirstLetter,
    getMeaningfulPathTokens,
    isOperationExcluded,
    getAllPathTokens,
};