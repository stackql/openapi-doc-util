
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

export { 
    log,
    printOptions,
    createDestDir,
};