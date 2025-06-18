# Committee Data Files

This directory contains JSON files with committee member data, where each file is named after the committee ID.

## File Format

Each file should be a JSON object with the following structure:

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
  ],
  "metadata": {
    "name": "Committee Name",
    "description": "Committee description",
    "createdAt": "ISO timestamp"
  }
}
```

## Usage

These files are used by the voter assignment endpoint (`/api/assign`) to determine which voters to assign to proposals. The endpoint tries to load committee data in this order:

1. Dynamic import of the JSON file (works in both dev and production)
2. API request as specified in environment variables (fallback)

## Cloudflare Deployment

Since this project is deployed on Cloudflare which doesn't support runtime filesystem operations, these committee files are dynamically imported during execution. The files need to be included in the build - they're bundled with the application during deployment.

Important notes:
- Any changes to committee data require a redeployment
- Filenames must match the committee IDs exactly
- Files must be valid JSON with the structure shown above
- All files in this directory will be included in the deployment
