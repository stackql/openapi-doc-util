# openapi-doc-util
> Command line utility to split OpenAPI documents into smaller, self contained, service oriented documents and prepare StackQL provider interfaces
> Command line utility to help developers prepare and submit StackQL provider specs, see [StackQL Readme](https://github.com/stackql/stackql/blob/main/README.md)

## Installation

<details>
<summary>NPM</summary>
<p>

```bash
npm i @stackql/openapi-doc-util
```

</p>
</details>

<details>
<summary>YARN</summary>
<p>

```bash
yarn add @stackql/openapi-doc-util
```

</p>
</details>

## Setup

from the package directory, run:

```bash
npm link
```

## Background

<details>
<summary>Read this section for background on the StackQL product</summary>
<p>
The StackQL utility provides a SQL interface to cloud and SaaS providers, mapping a provider to an ORM, transpiling input SQL to provider API requests, and bringing back response data as a SQL based result set.  StackQL is capable of DML operations such as `INSERT` and `DELETE` which can be used to provision or de-provision cloud resources, query operations using `SELECT` to collect, analyze, report on asset or configuration data, and lifecycle operations such as starting a VM instance using the `EXEC` command in StackQL.  

The StackQL ORM provides a logical model to work with cloud resources similar to the way databases are organized into schemas.  This object/resource hierarchy is summarized below:  

```
provider/
├─ service/
│  ├─ resource/
│  │  ├─ fields
│  │  ├─ methods
```

an example would be:

```
google/
├─ compute/
│  ├─ instances/
│  │  ├─ id, name, status, ...
│  │  ├─ select, insert, delete, start, stop, ...
```

Enabling StackQL to interact with the `google` provider using SQL semantics, for example:

Provider discovery operations such as..

```sql
SHOW RESOURCES IN google.compute;
DESCRIBE google.compute.instances;
```

Query operations such as..  

```sql
SELECT status, COUNT(*) as num_instances 
FROM google.compute.instances
WHERE project = 'myproject' and zone = 'us-west-1a'
GROUP BY status;
```

Provisioning operations such as creating a Compute Engine instance using an `INSERT` statement or deprovisioning an instance using a `DELETE` statement.  
</p>
</details>

<details>
<summary>Read this section for background on the StackQL Provider Registry</summary>
<p>
StackQL provider interfaces (such as GCP, Okta, GitHub, AWS, Azure, etc) are defined using annotations to the provider API (OpenAPI) specification, these annotations or extensions allow StackQL to map the providers resource to the desired ORM and define routes for SQL verbs such as `SELECT`, `INSERT`, `DELETE`, and `EXEC`.  
</p>
</details>

## Usage

```bash
openapi-doc-util <command> [<arguments(s)>] [<flag(s)>]
```

### Commands

__`validate`__  

Validates an OpenAPI specification document.   

__`split`__  

Splits an Open API document into smaller, self contained, service scoped documents based upon a specified service discriminator (JSONPath expression relative to each operation).  Takes an OpenAPI document as input and outputs the following structure:  

```
{output_dir}/
├─ {provider_name}/
│  ├─ {provider_version}/
│  │  ├─ services/
│  │  │  ├─ {service_name}/
│  │  │  │  ├─ {service_name}.yaml
│  │  │  ├─ .../
```
The `{service_name}.yaml` file is a self contained, OpenAPI specification document, containing only operations and components for the specified service.  

__`provider-dev`__  

Iterates through a directory of services (created using the `split` function), generates an additional document for each service `{service_name}-resources.yaml` and an index document for all services named `provider.yaml`, this is useful for developing new StackQL providers.  The output structure is as follows:  

```
{api_doc_dir}/
├─ {provider_name}/
│  ├─ {provider_version}/
│  │  ├─ services/
│  │  │  ├─ {service_name}/
│  │  │  │  ├─ {service_name}.yaml
│  │  │  │  ├─ {service_name}-resources.yaml
│  │  │  ├─ .../
│  │  ├─ provider.yaml
```
The original OpenAPI documents are not modified.  

The `provider-dev` function will infer SQL routes for operations under each resources under the `sqlVerbs` key, this should be reviewed by the developer, removing any duplicate or erroneous routes.

__`provider-build`__  

Operates on the dev directory structure generated using the `provider-dev` command, assembles a complete Open API specification per service including the StackQL resources for each service in each document under `components/x-stackQL-resources`, and outputs the following structure to a new directory:  

```
{output_dir}/
├─ {provider_name}/
│  ├─ {provider_version}/
│  │  ├─ services/
│  │  │  ├─ {service_name}/
│  │  │  │  ├─ {service_name}.yaml
│  │  │  ├─ .../
│  │  ├─ provider.yaml
```

The output from the `provider-build` command can be used to test locally (see [Test Using a Local Registry](#test-using-a-local-registry)). Once you have tested locally you can raise a pull request to [stackql/stackql-provider-registry](https://github.com/stackql/stackql-provider-registry).    


### Options

__`--svcDiscriminator`, `-s`__  *JSONPath expression* OR *svcName:servicename*

The __*service discriminator*__ option is used to determine how to split a large provider document into smaller, service scoped documents.  The option is required for the __`split`__ command and ignored otherwise.  If you do not wish to spilt the provider API spec, specify `svcName:<servicename>` for this option which will define one service in the StackQL provider with the name provided in *servicename*.  

> Example: `-s "$['x-github'].category"` would split the given provider API spec into service documents by matching the `x-github.category` value in each unique operation (combination of a path and an HTTP method) in API doc.

__`--resDiscriminator`, `-r`__  *JSONPath expression*  OR *path_tokens*

The __*resource discriminator*__ option is used to determine how to identify StackQL resources in a given provider API spec.  This option is used for the __`provider-dev`__ command and ignored otherwise.

> Example: `-r "$['x-github'].subcategory"`  would identify resources in the given provider API spec by matching the `x-github.subcategory` value in each unique operation (combination of a path and an HTTP method) in API doc.

if *path_tokens* is specified for the __`--resDiscriminator`__ option, the resource name will be derived by joining the 'meaningful' path tokens (not equivalent to the service name) with an '_'.  For instance a path of `/sites/{site_id}/service-instances` would result in a resource name of `sites_service_instances` assuming the service name was not `sites`.  

__`--methodkey`, `-m`__  *JSONPath expression*  

The __*method key*__ option determines uniquely named operations which are mapped to SQL methods in the StackQL ORM.  These methods are then mapped to default routes (SQL query and DML methods) in StackQL, the developer can override or update these mappings in the development docs which are outputted from the __`provider-dev`__  command.  This option is used for the __`provider-dev`__ command and ignored otherwise.  

> If supplied it must be a JSONPath expression relative to the operation (http path and verb), if not supplied it will default to `operationId` in the OpenAPI specification for each operation.  

__`--output`, `-o`__  *directory*  

The __*output directory*__ option specifies the root directory to output files from the  __`split`__, or the root directory to output assembled provider specs from the __`provider-build`__ command.  The default is the current working directory.  If the directory exists in either case the program will exit with an error unless the `--overwrite` option is set.

> If not supplied it will default to the current working directory

__`--overwrite`__

The __*overwrite*__ option specifies whether to overwrite files in the output directory.  The default is `false`.

__`--debug`, `-d`__  

__*debug flag*__ which can be set for additional print statements.  


## Example

This example demonstrates creating a StackQL provider for `github` and testing this provider locally using `stackql`

### Example Project Structure

The following directory structure represents the target after an API dev workspace is set up and the StackQL provider for `github` is built.

```
local-registry/
├─ ref/
│  ├─ github/
│  │  ├─ api.github.com.yaml
├─ dev/
│  ├─ github/
│  │  ├─ v0.1.0/
│  │  │  ├─ provider.yaml
│  │  │  ├─ services/
│  │  │  │  ├─ repos/
│  │  │  │  │  ├─ repos.yaml
│  │  │  │  │  ├─ repos-resources.yaml
│  │  │  │  ├─ .../
├─ src/
│  ├─ github/
│  │  ├─ v0.1.0/
│  │  │  ├─ provider.json
│  │  │  ├─ services/
│  │  │  │  ├─ repos/
│  │  │  │  │  ├─ repos-v0.1.0.json
```

`local-registry/ref/github/api.github.com.yaml` is the source OpenAPI 3 specification for the `github` api, this was sourced from [GitHub](https://github.com/github/rest-api-description/blob/main/descriptions/api.github.com/api.github.com.yaml).  

The `dev` directory contains the output of the dev docs generated by the `openapi-doc-util split` command, which will then serve as input to the `openapi-doc-util provider-dev` command.    

The `src` directory contains the output of the StackQL provider interface generated from the dev docs using `openapi-doc-util provider-build`.  


### 1. Split large spec into service specs

PowerShell:  

```PowerShell
cd local-registry
openapi-doc-util split `
-n github `
-v v0.1.0 `
-s "$['x-github'].category" `
-o .\dev `
./ref/github/api.github.com.yaml
```

Bash:  

```bash
cd local-registry
openapi-doc-util split \
-n github \
-v v0.1.0 \
-s '$["x-github"].category' \
-o ./dev \
ref/github/api.github.com.yaml
```

### 2. Create dev provider docs

PowerShell:  

```PowerShell
cd local-registry
openapi-doc-util provider-dev `
-n github `
-v v0.1.0 `
-r "$['x-github'].subcategory" `
.\dev
```

Bash:  

```bash
cd local-registry
openapi-doc-util provider-dev \
-n github \
-v v0.1.0 \
-r '$["x-github"].subcategory' \
./dev
```

### Assemble final provider docs

PowerShell:  

```PowerShell
cd local-registry
openapi-doc-util provider-build `
-n github `
-v v0.1.0 `
-o .\src `
.\dev
```

Bash:  

```bash
cd local-registry
openapi-doc-util provider-build \
-n github \
-v v0.1.0 \
-o ./src \
./dev
```

### Test Using a Local Registry

```bash
cd local-registry
PROVIDER_REGISTRY_ROOT_DIR="$(pwd)"
REG_STR='{"url": "file://'${PROVIDER_REGISTRY_ROOT_DIR}'", "localDocRoot": "'${PROVIDER_REGISTRY_ROOT_DIR}'", "verifyConfig": {"nopVerify": true}}'
AUTH_STR='{"github": { "type": "null_auth" }}'
./stackql shell --auth="${AUTH_STR}" --registry="${REG_STR}"
```