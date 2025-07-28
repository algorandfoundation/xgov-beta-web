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

For local development, use the Algokit Localnet. Create a `.env.development` file at the root of the cloned repository and fill it with the following:

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

Call `set_committee_manager` and `set_xgov_daemon`, providing your own account address. Then call `declare_committee`.

Now the xGov Registry should be in a good state.

### The mock-init.ts script

Rather than following the (potentially out-of-date) manual flow above, feel free to call the mock-init.ts script.

```bash
npm run mock-init
```

Run `npm run dev` and navigate to the page. The script will now run and set things up in the background.

Afterwards, make sure to re-comment the two lines from `src/layouts/Layout.astro`.

## Voter Assignment Endpoint

The application includes a POST endpoint at `/api/assign` that:

1. Gets all proposals with status SUBMITTED
2. For each proposal, retrieves the committee ID from its global state
3. Loads committee members from bundled JSON files or external API
4. Assigns committee members as voters to each proposal using parallel processing
5. Returns detailed results of the assignment process

### Environment Variables for Voter Assignment

To use this endpoint, add the following to your environment variables:

```bash
# Daemon/Committee publisher mnemonic used to assign voters
XGOV_DAEMON_MNEMONIC=your_mnemonic_phrase_here

# Committee data API URL (fallback if local files are unavailable)
COMMITTEE_API_URL=https://your-committee-api-endpoint

# Maximum number of proposals to process concurrently (optional, default: 5, max: 20)
MAX_CONCURRENT_PROPOSALS=10

# Maximum number of concurrent requests to make per proposal
MAX_REQUESTS_PER_PROPOSAL=5
```

### Committee Data Files

The voter assignment endpoint loads committee data using the following strategy:

1. **Primary Source**: Dynamic import of committee JSON files
   - Files located at `src/pages/api/committees/[committeeId].json`
   - Works in both development and production (including Cloudflare)
   - In development mode, files are located at `src/pages/api/committees-dev/[committeeId].json`

2. **Fallback**: API request to the URL specified in `COMMITTEE_API_URL` environment variable
   - Used when local files don't exist or can't be read
   - The committee ID is appended to the URL as a query parameter

For Cloudflare deployment, committee files must be placed in the `src/pages/api/committees` directory with filenames matching the base64url-encoded committee ID. These files are bundled with the application during deployment.

The required JSON format for committee data is:

```json
{
  "xGovs": [
    {
      "address": "ALGORAND_ADDRESS_1",
      "votes": 1000
    },
    {
      "address": "ALGORAND_ADDRESS_2",
      "votes": 2000
    }
    // More committee members...
  ]
}
```

### Making a Request to the Voter Assignment Endpoint

To trigger voter assignment, make a POST request to the endpoint:

```bash
curl -X POST https://your-domain/api/assign \
  -H "Content-Type: application/json" \
  -d '{"proposalIds": [123, 456]}'
```

#### Request Body Options:

* `proposalIds` (optional): Array of specific proposal IDs to process (if omitted, all SUBMITTED proposals will be processed)

#### Response Format:

```json
{
  "message": "Processed 10 proposals in 5.25s using parallel processing",
  "results": {
    "success": 8,
    "failed": 2,
    "details": [
      {
        "id": "123",
        "title": "Example Proposal",
        "voters": 100,
        "skippedVoters": 0,
        "totalVoters": 100,
        "status": "success"
      },
      // More proposal results...
    ]
  },
  "processingDetails": {
    "concurrencyLevel": 10,  // Value from MAX_CONCURRENT_PROPOSALS environment variable
    "executionTimeSeconds": 5.25
  }
}
```

The endpoint processes proposals in batches with parallel execution for better performance. For each proposal, it:
1. Extracts the committee ID from the proposal's global state
2. Loads committee data based on that ID
3. Checks for already assigned voters to prevent duplicates
4. Assigns eligible voters in optimized transaction groups (max 16 transactions per group)
5. Returns detailed statistics about the assignment operation

### Test the endpoint locally

To test locally, first we need to populate some mock data:

```bash
npm run mock-init-assign
```

Than, follow the instructions at the end of the script output.
