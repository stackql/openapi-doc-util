const arg = require('arg');
const commandLineUsage = require('command-line-usage');

const programName = 'openapi-doc-util';
const cmdDesc = 'OpenAPI utility for developing stackql provider interfaces.';
const splitDesc = 'Splits an API into self smaller contained documents based on the provided discriminator.';
const validateDesc = 'Validates an OpenAPI document.';
const providerDevDesc = 'Creates development documents for stackql provider interfaces.  These documents can be reviewed and modified as required, then packaged (using the build command) for local testing with stackql, and publishing to the stackql-provider-registry.';
const providerBuildDesc = 'Packages documents generated using the dev command, enabling local testing of the stackql provider and publishing to the stackql-provider-registry.';

const providerNameDesc = '[REQUIRED] Name of the API provider, this will be shown in "SHOW PROVIDERS" and used to access resources in stackql.';
const providerVerDesc = '[REQUIRED] User defined version for the API docs (does not have to be the same as openapi.info.version), shown in "REGISTRY LIST", semantic versioning is supported, versions should be in SEMVER format, prefixed with a "v", for example "v2.0.1".';
const overwriteDesc = '[OPTIONAL] Overwrite existing output files or directories.  (defaults to false)';
const debugDesc = '[OPTIONAL] Debug flag. (defaults to false)';

const cmdUsage = [
  {
    header: programName,
    content: cmdDesc
  },
  {
    header: 'Synopsis',
    content: `$ ${programName} <command> <options>`
  },
  {
    header: 'Command List',
    content: [
      { name: 'validate', summary: validateDesc },
      { name: 'split', summary: splitDesc },       
      { name: 'provider-dev', summary: providerDevDesc },
      { name: 'provider-build', summary: providerBuildDesc },
    ]
  },
];

const validateUsage = [
  {
    header: `${programName} validate`,
    content: validateDesc
  },
  {
    header: 'Synopsis',
    content: `$ ${programName} validate <apiDoc> <flags>`
  },
  {
    header: 'Arguments',
    content: [
      { name: 'apiDoc', summary: '[REQUIRED] OpenAPI specification to be validated.' },
    ]
  },
  {
      header: 'Flags',
      optionList: [
        {
          name: 'debug',
          alias: 'd',
          type: Boolean,
          description: debugDesc,
        },
      ]
    }    
];

const splitUsage = [
  {
    header: `${programName} split`,
    content: splitDesc
  },
  {
    header: 'Synopsis',
    content: `$ ${programName} split <apiDoc> <flags>`
  },
  {
    header: 'Arguments',
    content: [
      { name: 'apiDoc', summary: '[REQUIRED] OpenAPI specification to be split.' },
    ]
  },
  {
      header: 'Flags',
      optionList: [
        {
          name: 'providerName',
          alias: 'n',
          type: String,
          description: providerNameDesc,
        },
        {
          name: 'providerVersion',
          alias: 'v',
          type: String,
          description: providerVerDesc,
        },        
        {
          name: 'svcdiscriminator',
          alias: 's',
          type: String,
          typeLabel: '{underline JSONPath expression OR svcName:servicename}',
          description: '[REQUIRED] Service discriminator, used to split a large OpenAPI spec into smaller, self contained, service scoped documents using a JSONPath expression relative to each operation. Specify svcName:servicename to create one service named <servicename>.',
        },
        {
          name: 'output',
          alias: 'o',
          type: String,
          typeLabel: '{underline directory}',
          description: '[OPTIONAL] Directory to write the generated stackql provider development documents to. (defaults to cwd)',
        },
        {
          name: 'overwrite',
          type: Boolean,
          description: overwriteDesc,
        },        
        {
          name: 'debug',
          alias: 'd',
          type: Boolean,
          description: debugDesc,
        },        
      ]
    }    
];

const devUsage = [
    {
      header: `${programName} provider-dev`,
      content: providerDevDesc
    },
    {
      header: 'Synopsis',
      content: `$ ${programName} provider-dev <arguments> <flags>`
    },
    {
      header: 'Arguments',
      content: [
        { name: 'apiDocDirRoot', summary: '[REQUIRED] Directory root containing Open API documents for the provider you are creating a stackql provider interface for.' },
      ]
    },
    {
        header: 'Flags',
        optionList: [
          {
            name: 'providerName',
            alias: 'n',
            type: String,
            description: providerNameDesc,
          },
          {
            name: 'providerVersion',
            alias: 'v',
            type: String,
            description: providerVerDesc,
          },        
          {
            name: 'resdiscriminator',
            alias: 'r',
            type: String,
            typeLabel: '{underline JSONPath expression}',
            description: 'Resource discriminator, used to identify stackql resources from a providers OpenAPI spec.',
          },
          {
            name: 'methodkey',
            alias: 'm',
            type: String,
            typeLabel: '{underline JSONPath expression}',
            description: 'Used to identify resource methods from a providers OpenAPI spec. (defaults to $.operationId)',
          },
//          {
//            name: 'format',
//            alias: 'f',
//            type: String,
//            typeLabel: '{underline yaml, json, toml or hcl}',
//            description: 'Output format for stackql provider and resource definitions. (defaults to yaml)',
//          },
          {
            name: 'overwrite',
            type: Boolean,
            description: overwriteDesc,
          },        
          {
            name: 'debug',
            alias: 'd',
            type: Boolean,
            description: debugDesc,
          },                                        
        ]
      }    
];

const buildUsage = [
    {
        header: `${programName} provider-build`,
        content: providerBuildDesc
      },
      {
        header: 'Synopsis',
        content: `$ ${programName} provider-build <arguments> <flags>`
      },
      {
        header: 'Arguments',
        content: [
          { name: 'providerDevDocRoot', summary: 'Source directory containing stackql provider development documents generated using the provider-dev command.' },
        ]
      },
      {
          header: 'Flags',
          optionList: [
            {
              name: 'providerName',
              alias: 'n',
              type: String,
              description: providerNameDesc,
            },
            {
              name: 'providerVersion',
              alias: 'v',
              type: String,
              description: providerVerDesc,
            },        
            {
              name: 'output',
              alias: 'o',
              type: String,
              typeLabel: '{underline directory}',
              description: '[OPTIONAL] Directory to write the generated stackql provider development documents to. (defaults to cwd)',
            },
            {
              name: 'overwrite',
              type: Boolean,
              description: overwriteDesc,
            },
            {
              name: 'servers',
              type: String,
              description: '[OPTIONAL] JSON string to replace the servers section of the OpenAPI spec. (defaults to original servers section)',
            },                    
            {
              name: 'debug',
              alias: 'd',
              type: Boolean,
              description: debugDesc,
            },                                        
          ]
        }
];

function showUsage(operation) {
    switch(operation) {
        case 'validate':
          console.log(commandLineUsage(validateUsage));
          break;
        case 'split':
          console.log(commandLineUsage(splitUsage));
          break;
        case 'provider-dev':
            console.log(commandLineUsage(devUsage));
            break;
        case 'provider-build':
            console.log(commandLineUsage(buildUsage));
            break;
        default:
            console.log(commandLineUsage(cmdUsage));
    };
}

function parseArgumentsIntoOptions(rawArgs) {
 const args = arg(
   {
     '--providername': String,
     '--providerversion': String,
     '--svcdiscriminator': String,
     '--resdiscriminator': String,
     '--exclude': String,
     '--methodkey': String,
     '--output': String,
     '--format': String,
     '--overwrite': Boolean,
     '--servers': String,
     '--debug': Boolean,
     '-n': '--providername',
     '-v': '--providerversion',
     '-s': '--svcdiscriminator',
     '-r': '--resdiscriminator',
     '-x': '--exclude',
     '-m': '--methodkey',
     '-o': '--output',
     '-f': '--format',
     '-d': '--debug',
   },
   {
     argv: rawArgs.slice(2),
   }
 );
 return {
   methodKey: args['--methodkey'] || 'operationId',
   providerName: args['--providername'] || false,
   providerVersion: args['--providerversion'] || false,
   svcDiscriminator: args['--svcdiscriminator'] || false,
   resDiscriminator: args['--resdiscriminator'] || false,
   exclude: args['--exclude'] || false,
   outputDir: args['--output'] || process.cwd(),
   outputFormat: args['--format'] || 'yaml',
   overwrite: args['--overwrite'] || false,
   servers: args['--servers'] || false,
   debug: args['--debug'] || false,
   operation: args._[0] || false,
   apiDocOrDir: args._[1] || false,
 };
}

export {
  showUsage,
  parseArgumentsIntoOptions,
}
