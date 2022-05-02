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
│  │  ├─ start, stop, ...
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
openapi-doc-util <command> <apiDoc or providerDevDocRoot> <stackqlProviderName> <stackqlProviderVersion> [<OPTIONS>]
```

### Commands

__`dev`__  

Creates StackQL provider development docs and splits an API into service scoped documents based upon a specified discriminator (optional).  Development docs will parse a providers API and map default routes for StackQL query and DML operations, these can be modified or enriched by the developer.  For convenience, development docs can be generated in `json`, `yaml`, `toml` or `hcl` formats.  The development docs are then assembled using the __build__ command and then can be tested locally see [Test Using a Local Registry](#test-using-a-local-registry).  Once you have tested locally you can raise a pull request to [stackql/stackql-provider-registry](https://github.com/stackql/stackql-provider-registry).    

__`build`__  

Assembles StackQL development docs into a registry compatible format, ready to use as a local registry for testing or to raise a pull request to [stackql/stackql-provider-registry](https://github.com/stackql/stackql-provider-registry).  


### Options

__`--svcDiscriminator`, `-s`__  *JSONPath expression* OR *svcName:servicename*

The __*service discriminator*__ option is used to determine how to split a large provider document into smaller, service scoped documents.  The option is required for the __`dev`__ command and ignored otherwise.  If you do not wish to spilt the provider API spec, specify `svcName:<servicename>` for this option which will define one service in the StackQL provider with the name provided in *servicename*.  

> Example: `-s "$['x-github'].category"` would split the given provider API spec into service documents by matching the `x-github.category` value in each unique operation (combination of a path and an HTTP method) in API doc.

__`--resDiscriminator`, `-r`__  *JSONPath expression*  

The __*resource discriminator*__ option is used to determine how to identify StackQL resources in a given provider API spec.

> Example: `-r "$['x-github'].subcategory"`  would identify resources in the given provider API spec by matching the `x-github.subcategory` value in each unique operation (combination of a path and an HTTP method) in API doc.

__`--methodkey`, `-m`__  *JSONPath expression*  

The __*method key*__ option determines uniquely named operations which are mapped to SQL methods in the StackQL ORM.  These methods are then mapped to default routes (SQL query and DML methods) in StackQL, the developer can override or update these mappings in the development docs which are outputted from the __`dev`__  command.

> If supplied it must be a JSONPath expression relative to the operation (http path and verb), if not supplied it will default to `operationId` in the OpenAPI specification for each operation.  

__`--output`, `-o`__  *directory*  

The __*output directory*__ option specifies where to write out the development docs in a __`dev`__ operation or the production docs in a __`build`__ operation.  

> If not supplied it will default to the current working directory

__`--format`, `-f`__  *yaml | json | toml | hcl*  

The __*output format*__ option specifies the desired output for the development docs - the annotations/extensions required for StackQL which the developer can modify or enrich.  For convenience multiple serialization formats are available including `yaml`, `json`, `toml` and `hcl` (the HashiCorp Configuration Language).  

__`--debug`, `-d`__  

__*debug flag*__ which can be set for additional print statements.  


## Example

This example demonstrates creating a StackQL provider for `github` and testing this provider locally using `stackql`


### Example Project Structure

The following directory structure represents the target after an API dev workspace is set up and the StackQL provider for `github` is built.


```
local-registry/
├─ dev/
│  ├─ github/
│  │  ├─ v1/
│  │  │  ├─ provider.yaml
│  │  │  ├─ services/
│  │  │  │  ├─ repos/
│  │  │  │  │  ├─ repos-v1.yaml
│  │  │  │  │  ├─ repos-v1-resources.yaml
│  │  │  │  ├─ .../
├─ ref/
│  ├─ github/
│  │  ├─ api.github.com.yaml
├─ src/
│  ├─ github/
│  │  ├─ v1/
│  │  │  ├─ provider.json
│  │  │  ├─ services/
│  │  │  │  ├─ repos/
│  │  │  │  │  ├─ repos-v1.json
```

`local-registry/ref/github/api.github.com.yaml` is the source OpenAPI 3 specification for the `github` api, this was sourced from [GitHub](https://github.com/github/rest-api-description/blob/main/descriptions/api.github.com/api.github.com.yaml).  

The `dev` directory contains the output of the dev docs generated by `openapi-doc-util dev`,  

The `src` directory contains the output of the StackQL provider interface generated from the dev docs using `openapi-doc-util build`.  


### Create Working Provider Docs

PowerShell:  

```PowerShell
cd local-registry
openapi-doc-util dev `
./ref/github/api.github.com.yaml `
github `
v1 `
-s "$['x-github'].category" `
-r "$['x-github'].subcategory" `
-o ./dev `
-f toml
```

Bash:  

```bash
cd local-registry
openapi-doc-util dev \
ref/github/api.github.com.yaml \
github \
v1 \
-s '$["x-github"].category' \
-r '$["x-github"].subcategory' \
-o ./dev \
-f yaml
```

### Build Provider Docs


PowerShell:  

```PowerShell
cd local-registry
openapi-doc-util `
build `
./dev `
github `
v1 `
-o ./src
```

Bash:  

```bash
cd local-registry
openapi-doc-util \
build \
./dev \
github \
v1 \
-o ./src
```

### Test Using a Local Registry

```bash
cd local-registry
PROVIDER_REGISTRY_ROOT_DIR="$(pwd)"
REG_STR='{"url": "file://'${PROVIDER_REGISTRY_ROOT_DIR}'", "localDocRoot": "'${PROVIDER_REGISTRY_ROOT_DIR}'", "verifyConfig": {"nopVerify": true}}'
AUTH_STR='{"github": { "type": "null_auth" }}'
./stackql shell --auth="${AUTH_STR}" --registry="${REG_STR}"
```


