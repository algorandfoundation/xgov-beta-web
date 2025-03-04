# xGov Beta Web

This repository constitutes the frontend part of the xGov Beta project.

The smart contract (written in Algorand Python) repository can be found at [xgov-beta-sc](https://github.com/algorandfoundation/xgov-beta-sc).

There is also [xgov-beta-ts](https://github.com/algorandfoundation/xgov-beta-ts), which takes xgov-beta-sc as a git submodule and produces typed clients for the smart contracts using `algokit generate client`.

Refer to the [xGov Beta](https://docs.google.com/document/d/16bVBovvmMXvz-iazF7PK_FbsL-hetjomMk0xhPJZ-2g/edit?tab=t.0) document for more information.

## Local Development

This is fundamentally an [Astro project](https://astro.build), with React as the main framework.

Run the following to spin up the project:

```bash
npm install
npm run dev
```

Follow the steps below to ensure proper setup.

## .env file

For the frontend to properly work, you need to have an initialized xGov Registry smart contract deployed on a network. You will also need to specify which algod, indexer and kmd servers it should be pointed towards.

For local development, use the Algokit Localnet. Create a `.env` file at the root of the cloned repository and fill it with the following:

```bash
PUBLIC_ALGOD_SERVER=http://localhost
PUBLIC_ALGOD_PORT=4001
PUBLIC_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

PUBLIC_INDEXER_SERVER=http://localhost
PUBLIC_INDEXER_PORT=8980
PUBLIC_INDEXER_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

PUBLIC_KMD_SERVER=http://localhost
PUBLIC_KMD_PORT=4002

PUBLIC_REGISTRY_APP_ID= # Add the application ID here
```

You will need to set the APP ID to correspond to the xGov Registry contract.

## xGov Registry Contract Setup

There are two ways to setup the xGov Registry Contract.

Note that we are assuming that you have Localnet running in Docker, i.e. you have successfully run `algokit localnet start`.

### Manual Method (Lora)

1. Grab the [arc32.json artifact from xgov-beta-sc](https://github.com/algorandfoundation/xgov-beta-sc/blob/main/smart_contracts/artifacts/xgov_registry/XGovRegistry.arc32.json).

2. Navigate to Lora (e.g. by calling `algokit localnet explore`)

3. Connect your wallet, picking Localnet and KMD as the option.

4. Navigate to App Lab --> Create App Interface --> Deploy New App.

5. Upload the arc32.json spec file. Press Next.

6. Press create Call to Build Transaction. Press Add. Press Deploy.

Now, if you were not already redirected, press App Lab and find the xGov Registry interface. Grab the App ID and paste it in the .env file.

Note that just because you have created the xGov Registry does not mean that it is in a good enough state (i.e., that it has been initialized properly) to be read by the frontend.

The frontend makes a `simulate` call on the [get_state method in the xGov Registry](https://github.com/algorandfoundation/xgov-beta-sc/blob/152168696263e474415e9786278331cd35ebd422/smart_contracts/xgov_registry/contract.py#L894). The output corresponds to the TypedGlobalState type.

The xGov Registry smart contract needs to be:

1. Funded.

Go to Lora --> Fund. Type in the xGov Registry's account address and fund it with tokens.

2. Have a declared Committee.

Go to Lora --> App Lab --> {Your xGov Registry contract}.

Call `set_committee_manager` and `set_committee_publisher`, providing your own account address. Then call `declare_committee`.

Now the xGov Registry should be in a good state.

### The mock-init.ts script

Rather than following the (potentially out-of-date) manual flow above, feel free to call the mock-init.ts script.

The script relies on there being an IPFS server.
The [kubo-rpc-client](https://www.npmjs.com/package/kubo-rpc-client) NPM package has a default URL setting of
`http://localhost:5001/api/v0` so you will need to setup an IPFS server.

A `docker-compose.yml` file has been created for that purpose.

First, create the following directories in the root of the repository:

```bash
mkdir ipfs_staging
mkdir ipfs_data
```

Then, spin up the docker container:

```bash
docker-compose up -d
```

Finally, run the script:

```bash
npm run mock-init
```

Run `npm run dev` and navigate to the page. The script will now run and set things up in the background.

Afterwards, make sure to re-comment the two lines from `src/layouts/Layout.astro`.
